using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Infrastructure.Persistence;
using EraSwiataLegend.Infrastructure.Files;
using EraSwiataLegend.Infrastructure.Ai;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EraSwiataLegend.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        services.Configure<FileStorageOptions>(options =>
        {
            options.RootPath = configuration[
                $"{FileStorageOptions.SectionName}:RootPath"]
                ?? options.RootPath;
        });
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddSingleton<IAiSearchProvider, DisabledAiSearchProvider>();

        return services;
    }
}
