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

namespace Application.Comments {
    public class Create {
        public class Command : IRequest<CommentDto> {
            public string Body { get; set; }
            public Guid ActivityId { get; set; }
            public String Username { get; set; }

        }

        public class Handler : IRequestHandler<Command, CommentDto> {
            private readonly IMapper _mapper;
            public Handler (DataContext context, IMapper mapper) {
                _mapper = mapper;
                _context = context;
            }

            public DataContext _context { get; }

            public async Task<CommentDto> Handle (Command request, CancellationToken cancellationToken) {
                
                var activity = await _context.Activities.FindAsync(request.ActivityId);

                if (activity==null)
                {
                    throw new RestException(HttpStatusCode.NotFound, new {Activity="Not found"});
                }

                var user = await _context.Users.SingleOrDefaultAsync(x=> x.UserName == request.Username);

                var comment = new Comment{
                    Author=user,
                    Activity=activity,
                    Body=request.Body,
                    CreateAt=DateTime.Now
                };

                activity.Comments.Add(comment);

                var success = await _context.SaveChangesAsync () > 0;
                if (success) return _mapper.Map<CommentDto>(comment);

                throw new Exception ("Problem Saving Changes");

            }
        }
    }
}