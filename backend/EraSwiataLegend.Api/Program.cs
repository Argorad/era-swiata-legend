using EraSwiataLegend.Api.Endpoints;
using EraSwiataLegend.Application;
using EraSwiataLegend.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://192.168.1.63:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");

// app.UseHttpsRedirection();

app.MapGet("/", () =>
{
    return Results.Ok("Era Świata Legend API działa!");
});

app.MapWorldEndpoints();
app.MapFolderEndpoints();
app.MapPageEndpoints();

app.Run();