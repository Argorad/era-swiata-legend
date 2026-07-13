using EraSwiataLegend.Api.Endpoints;
using EraSwiataLegend.Application;
using EraSwiataLegend.Infrastructure;
using EraSwiataLegend.Api.Authorization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AuthorizationPolicies.Administrator,
        policy => policy.RequireRole("Administrator"));
    options.AddPolicy(
        AuthorizationPolicies.GameMasterOrAdministrator,
        policy => policy.RequireRole(
            "Administrator",
            "GameMaster"));
    options.AddPolicy(
        AuthorizationPolicies.AuthenticatedReader,
        policy => policy.RequireAuthenticatedUser());
});

builder.Services.AddCors(options =>
{
    var frontendOrigins = builder.Configuration[
            "Frontend:Origins"]?
        .Split(
            ';',
            StringSplitOptions.RemoveEmptyEntries |
            StringSplitOptions.TrimEntries)
        ?? ["http://localhost:5173"];

    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(frontendOrigins)
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
app.UseAuthorization();

// app.UseHttpsRedirection();

app.MapGet("/", () =>
{
    return Results.Ok("Era Świata Legend API działa!");
});

app.MapWorldEndpoints();
app.MapFolderEndpoints();
app.MapPageEndpoints();
app.MapFileEndpoints(builder.Configuration);
app.MapSearchEndpoints();
app.MapMapEndpoints(builder.Configuration);
app.MapReadinessEndpoints(builder.Configuration);

app.Run();
