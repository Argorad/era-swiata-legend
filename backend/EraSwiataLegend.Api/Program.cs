using EraSwiataLegend.Api.Authentication;
using EraSwiataLegend.Api.Endpoints;
using EraSwiataLegend.Application;
using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Infrastructure;
using EraSwiataLegend.Api.Authorization;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = ".EraSwiataLegend.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromHours(12);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var service = context.HttpContext.RequestServices
                .GetRequiredService<LocalAuthService>();
            var user = await service.ValidatePrincipalAsync(
                context.Principal!,
                context.HttpContext.RequestAborted);
            if (user is null)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });
builder.Services.AddSingleton<PasswordHasher<UserAccount>>();
builder.Services.AddScoped<LocalAuthService>();
builder.Services.AddScoped<LocalAuthBootstrapper>();
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth-login", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
        limiter.AutoReplenishment = true;
    });
});
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
    var frontendOrigins = GetFrontendOrigins(builder.Configuration);

    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(frontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

if (builder.Configuration.GetValue<bool>("Authentication:Enabled"))
{
    using var bootstrapScope = app.Services.CreateScope();
    var bootstrapper = bootstrapScope.ServiceProvider
        .GetRequiredService<LocalAuthBootstrapper>();
    await bootstrapper.EnsureBootstrapAdministratorAsync(
        CancellationToken.None);
}

// app.UseHttpsRedirection();

app.MapGet("/", () =>
{
    return Results.Ok("Era Świata Legend API działa!");
});

app.MapWorldEndpoints(builder.Configuration);
app.MapFolderEndpoints(builder.Configuration);
app.MapPageEndpoints(builder.Configuration);
app.MapFileEndpoints(builder.Configuration);
app.MapSearchEndpoints(builder.Configuration);
app.MapMapEndpoints(builder.Configuration);
app.MapAuthEndpoints(builder.Configuration);
app.MapUserEndpoints(builder.Configuration);
app.MapReadinessEndpoints(builder.Configuration);

app.Run();

static string[] GetFrontendOrigins(IConfiguration configuration)
{
    var rawOrigins = configuration["Frontend:Origins"]
        ?? configuration["Frontend__Origins"]
        ?? "http://localhost:5173";

    return rawOrigins
        .Split(new[] { ';', ',', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}
