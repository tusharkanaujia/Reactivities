using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Persistance;

namespace Application.Activities {
    public class List {

        public class ActivityEnvelope {
            public List<ActivityDto> Activities { get; set; }
            public int ActivityCount { get; set; }
        }
        public class Query : IRequest<ActivityEnvelope> {
            public DateTime? StartDate { get; set; }
            public bool IsHost { get; set; }
            public int? Limit { get; set; }
            public int? Offset { get; set; }
            public bool IsGoing { get; set; }
            public Query (int? limit, int? offset, bool isGoing, bool isHost, DateTime? startDate) {
                IsGoing = isGoing;
                IsHost = isHost;
                StartDate = startDate?? DateTime.Now;
                Offset = offset;
                Limit = limit;
            }

        }

        public class Handler : IRequestHandler<Query, ActivityEnvelope> {
            private readonly DataContext _context;
            private readonly IMapper _mapper;
            private readonly IUserAccessor _userAccessor;

            public Handler (DataContext context, ILogger<List> logger, IMapper mapper, IUserAccessor userAccessor) {
                _userAccessor = userAccessor;
                _mapper = mapper;
                _context = context;
                _logger = logger;
            }

            public ILogger<List> _logger { get; }

            public async Task<ActivityEnvelope> Handle (Query request, CancellationToken cancellationToken) {
                try {

                    cancellationToken.ThrowIfCancellationRequested ();
                    await Task.Delay (1, cancellationToken);
                    _logger.LogInformation ($"Task has completed");

                } catch (Exception ex) {
                    _logger.LogInformation ($"Task cancelled: {ex}");
                }

                var querable = _context.Activities
                    .Where (x => x.Date >= request.StartDate)
                    .OrderBy (x => x.Date)
                    .AsQueryable ();

                if (request.IsGoing && !request.IsHost) {
                    querable = querable.Where (x=>x.UserActivities.Any(a=>a.AppUser.UserName == _userAccessor.GetCurrentUsername()));
                }
                if (!request.IsGoing && request.IsHost) {
                    querable = querable.Where (x=>x.UserActivities.Any(a=>a.AppUser.UserName == _userAccessor.GetCurrentUsername() && a.IsHost ));
                }

                var activities = await querable
                    .Skip (request.Offset ?? 0)
                    .Take (request.Limit ?? 3)
                    .ToListAsync (cancellationToken);

                return new ActivityEnvelope {
                    Activities = _mapper.Map<List<Activity>, List<ActivityDto>> (activities),
                        ActivityCount = querable.Count ()
                };
            }
        }
    }
}