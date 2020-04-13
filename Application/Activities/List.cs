using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Persistance;

namespace Application.Activities {
    public class List {
        public class Query : IRequest<List<Activity>> { }

        public class Handler : IRequestHandler<Query, List<Activity>> {
            private readonly DataContext _context;

            public Handler (DataContext context, ILogger<List> logger) {
                _context = context;
                _logger = logger;
            }

            public ILogger<List> _logger { get; }

            public async Task<List<Activity>> Handle (Query request, CancellationToken cancellationToken) {
                try {

                    cancellationToken.ThrowIfCancellationRequested ();
                    await Task.Delay (1, cancellationToken);
                    _logger.LogInformation ($"Task has completed");

                } catch (Exception ex) {
                    _logger.LogInformation ($"Task cancelled: {ex}");
                }
                var activities = await _context.Activities.ToListAsync (cancellationToken);
                return activities;
            }
        }
    }
}