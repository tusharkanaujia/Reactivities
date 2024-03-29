using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Activities;
using Application.Interfaces;
using Application.Profiles;
using API.Middleware;
using API.SignalR;
using AutoMapper;
using Domain;
using FluentValidation.AspNetCore;
using Infrastruture.Photos;
using Infrastruture.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Persistance;

namespace API {
    public class Startup {
        public Startup (IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices (IServiceCollection services) {
            services.AddDbContext<DataContext> (optionsAction => {
                optionsAction.UseLazyLoadingProxies ();
                optionsAction.UseSqlite (Configuration.GetConnectionString ("DefaultConnection"));
            });
            services.AddCors (opt => {
                opt.AddPolicy ("CorsPolicy", policy => {
                    policy.AllowAnyHeader ()
                          .AllowAnyMethod ()
                          .WithExposedHeaders("WWW-Authenticate")
                          .WithOrigins ("http://localhost:3000")
                          .AllowCredentials ();
                });
            });

            services.AddControllers ()
                .AddFluentValidation (cfg => {
                    cfg.RegisterValidatorsFromAssemblyContaining<Create> ();
                });

            services.AddMvc (opt => {
                var policy = new AuthorizationPolicyBuilder ().RequireAuthenticatedUser ().Build ();
                opt.Filters.Add (new AuthorizeFilter (policy));
            });
            services.AddMediatR (typeof (List.Handler).Assembly);

            services.AddAutoMapper (typeof (List.Handler));
            services.AddSignalR ();

            var builder = services.AddIdentityCore<AppUser> ();
            var identityBuilder = new IdentityBuilder (builder.UserType, builder.Services);
            identityBuilder.AddEntityFrameworkStores<DataContext> ();
            identityBuilder.AddSignInManager<SignInManager<AppUser>> ();

            services.AddAuthorization (opt => {
                opt.AddPolicy ("IsActivityHost", policy => {
                    policy.Requirements.Add (new IsHostRequirement ());
                });
            });
            services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler> ();

            var key = new SymmetricSecurityKey (Encoding.UTF8.GetBytes (Configuration["TokenKey"]));
            services.AddAuthentication (JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer (
                    opt => {
                        opt.TokenValidationParameters = new TokenValidationParameters {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        ValidateAudience = false,
                        ValidateIssuer = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                        };
                        opt.Events = new JwtBearerEvents {
                            OnMessageReceived = context => {
                                var accessToken = context.Request.Query["access_token"];
                                var path = context.HttpContext.Request.Path;
                                if (!string.IsNullOrEmpty (accessToken) && path.StartsWithSegments ("/chat")) {
                                    context.Token = accessToken;
                                }
                                return Task.CompletedTask;
                            }
                        };
                    }
                );

            services.AddScoped<IJwtGenerator, JwtGenerator> ();
            services.AddScoped<IUserAccessor, UserAccessor> ();
            services.AddScoped<IPhotoAccessor, PhotoAccessor> ();
            services.AddScoped<IProfileReader, ProfileReader> ();
            services.AddScoped<IFacebookAccessor, FacebookAccessor> ();

            services.Configure<CloudinarySettings> (Configuration.GetSection ("Cloudinary"));
            services.Configure<FacebookAppSettings> (Configuration.GetSection ("Authentication:Facebook"));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure (IApplicationBuilder app, IWebHostEnvironment env) {
            app.UseMiddleware<ErrorHandlingMiddleware> ();
            if (env.IsDevelopment ()) {
                //app.UseDeveloperExceptionPage();

            }
            
            //app.UseHttpsRedirection();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseRouting ();
            app.UseCors ("CorsPolicy");

            app.UseAuthentication ();
            app.UseAuthorization ();

            app.UseEndpoints (endpoints => {
                endpoints.MapControllers ();
                endpoints.MapHub<ChatHub> ("/chat");
                endpoints.MapFallbackToController("Index", "Fallback");
            });
        }
    }
}