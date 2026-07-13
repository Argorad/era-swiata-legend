using EraSwiataLegend.Application.Folders.Handlers;
using EraSwiataLegend.Application.Files;
using EraSwiataLegend.Application.Pages.Handlers;
using EraSwiataLegend.Application.Search;
using EraSwiataLegend.Application.Map;
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
        services.AddScoped<SetWorldStatusCommandHandler>();

        services.AddScoped<CreateFolderCommandHandler>();
        services.AddScoped<GetFoldersQueryHandler>();
        services.AddScoped<RenameFolderCommandHandler>();
        services.AddScoped<MoveFolderCommandHandler>();

        services.AddScoped<CreatePageCommandHandler>();
        services.AddScoped<GetPagesQueryHandler>();
        services.AddScoped<PageManagementService>();
        services.AddScoped<FileLibraryService>();
        services.AddScoped<KnowledgeSearchService>();
        services.AddScoped<MapMarkerService>();
        services.AddScoped<WorldMapService>();
        services.AddScoped<MarkerCategoryService>();
        services.AddScoped<MapCompositionService>();

        return services;
    }
}
