using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Application.Activities {
    public class UnAttend {
        public class Command : IRequest {
            public Guid Id { get; set; }
        }

        public class Handler : IRequestHandler<Command> {
            private readonly IUserAccessor _userAccessor;
            public Handler (DataContext context, IUserAccessor userAccessor) {
                _userAccessor = userAccessor;
                _context = context;
            }

            public DataContext _context { get; }

            public async Task<Unit> Handle (Command request, CancellationToken cancellationToken) {
                // handler code goes here
                 var activity = await _context.Activities.FindAsync (request.Id);

                if (activity == null) {
                    throw new RestException (HttpStatusCode.NotFound, new { Activity = "Could not find activity" });
                }

                var user = await _context.Users.SingleOrDefaultAsync (x => x.UserName == _userAccessor.GetCurrentUsername ());
                var attendance = await _context.UserActivities.SingleOrDefaultAsync (x => x.Activity.Id == activity.Id && x.AppUserId == user.Id);
                
                if (attendance == null)
                {
                    return Unit.Value;    
                }

                if (attendance.IsHost)
                {
                    throw new RestException (HttpStatusCode.BadRequest, new { Activity = "You are the host, you cannot remove yourself from the activity" });

                }
                
                _context.UserActivities.Remove(attendance);

                var success = await _context.SaveChangesAsync () > 0;
                if (success) return Unit.Value;

                throw new Exception ("Problem Saving Changes");

            }
        }
    }
}