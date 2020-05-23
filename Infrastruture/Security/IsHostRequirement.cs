using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Persistance;

namespace Infrastruture.Security {
    public class IsHostRequirement : IAuthorizationRequirement {

    }

    public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement> {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly DataContext _context;
        public IsHostRequirementHandler (DataContext Context, IHttpContextAccessor httpContextAccessor) {
            _context = Context;
            _httpContextAccessor = httpContextAccessor;
        }

        protected override Task HandleRequirementAsync (AuthorizationHandlerContext context, IsHostRequirement requirement) {
            
            if (context.Resource is AuthorizationFilterContext authorizationFilterContext)
            {
                
            
                var currentUserName = _httpContextAccessor.HttpContext.User?.Claims?.SingleOrDefault(x => x.Type==ClaimTypes.NameIdentifier)?.Value;

                var activityId  = Guid.Parse(authorizationFilterContext.RouteData.Values["id"].ToString());

                var activity = _context.Activities.FindAsync(activityId).Result;

                var host = activity.UserActivities.FirstOrDefault(x=>x.IsHost);

                if (host?.AppUser?.UserName==currentUserName)
                {
                    context.Succeed(requirement);
                }
            }
            else
            {
                context.Fail();
            }
            return Task.CompletedTask;
        }
    }
}