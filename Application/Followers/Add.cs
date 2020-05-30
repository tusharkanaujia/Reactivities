using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using AutoMapper;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Followers {
    public class Add {
        public class Command : IRequest {
            public string Username { get; set; }
        }

        public class Handler : IRequestHandler<Command> {
            private readonly IUserAccessor _userAccessor;
            public Handler (DataContext context, IUserAccessor userAccessor) {
                _userAccessor = userAccessor;
                _context = context;
            }

            public DataContext _context { get; }

            public async Task<Unit> Handle (Command request, CancellationToken cancellationToken) {
                var observer = await _context.Users.SingleOrDefaultAsync(x=> x.UserName == _userAccessor.GetCurrentUsername());

                var target = await _context.Users.SingleOrDefaultAsync(x=> x.UserName == request.Username);

                if (target == null)
                {
                    throw new RestException(HttpStatusCode.NotFound, new {User = "Not found"});
                }

                var following = await _context.Followings.SingleOrDefaultAsync(x=> x.ObserverId==observer.Id && x.TargetId==target.Id); 

                if (following != null)
                {
                    throw new RestException(HttpStatusCode.BadRequest, new {User = "You are already following this user"});
                }
                else
                {
                    following = new UserFollowing{Observer=observer,Target=target};
                    _context.Followings.Add(following);
                }

                var success = await _context.SaveChangesAsync () > 0;
                
                if (success) return Unit.Value;

                throw new Exception ("Problem Saving Changes");

            }
        }
    }
}