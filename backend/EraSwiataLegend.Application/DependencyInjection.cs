using EraSwiataLegend.Application.Folders.Handlers;
using EraSwiataLegend.Application.Pages.Handlers;
using EraSwiataLegend.Application.Worlds.Handlers;
using Microsoft.Extensions.DependencyInjection;

namespace EraSwiataLegend.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services)
    {
        services.AddScoped<CreateWorldCommandHandler>();
        services.AddScoped<GetWorldsQueryHandler>();

        services.AddScoped<CreateFolderCommandHandler>();
        services.AddScoped<GetFoldersQueryHandler>();
        services.AddScoped<RenameFolderCommandHandler>();
        services.AddScoped<MoveFolderCommandHandler>();

        services.AddScoped<CreatePageCommandHandler>();
        services.AddScoped<GetPagesQueryHandler>();

        return services;
    }
}