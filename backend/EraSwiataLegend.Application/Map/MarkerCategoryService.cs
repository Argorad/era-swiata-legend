using System.Text.RegularExpressions;
using EraSwiataLegend.Application.Interfaces;
using EraSwiataLegend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EraSwiataLegend.Application.Map;

public sealed partial class MarkerCategoryService
{
    private readonly IApplicationDbContext _dbContext;

    public MarkerCategoryService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<MarkerCategoryDto>> GetAsync(
        Guid worldId,
        bool playerView,
        CancellationToken cancellationToken) =>
        _dbContext.MarkerCategories
            .AsNoTracking()
            .Where(category =>
                category.WorldId == worldId &&
                (!playerView || category.IsActive))
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .Select(category => new MarkerCategoryDto(
                category.Id,
                category.WorldId,
                category.Name,
                category.Icon,
                category.Color,
                category.SortOrder,
                category.IsActive,
                category.CreatedAt,
                category.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<MarkerCategoryOperationResult> CreateAsync(
        Guid worldId,
        SaveMarkerCategoryRequest request,
        CancellationToken cancellationToken)
    {
        if (!await _dbContext.Worlds.AnyAsync(
                world => world.Id == worldId,
                cancellationToken))
        {
            return new(null, "WorldNotFound");
        }

        var error = await ValidateAsync(
            worldId,
            null,
            request,
            cancellationToken);

        if (error is not null) return new(null, error);

        var category = new MarkerCategory { WorldId = worldId };
        category.Update(
            request.Name,
            request.Icon,
            request.Color,
            request.SortOrder,
            request.IsActive);
        _dbContext.MarkerCategories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(category), null);
    }

    public async Task<MarkerCategoryOperationResult> UpdateAsync(
        Guid worldId,
        Guid categoryId,
        SaveMarkerCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.MarkerCategories
            .FirstOrDefaultAsync(
                item =>
                    item.Id == categoryId &&
                    item.WorldId == worldId,
                cancellationToken);

        if (category is null)
        {
            return new(null, "CategoryNotFound");
        }

        var error = await ValidateAsync(
            worldId,
            categoryId,
            request,
            cancellationToken);

        if (error is not null) return new(null, error);

        category.Update(
            request.Name,
            request.Icon,
            request.Color,
            request.SortOrder,
            request.IsActive);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new(ToDto(category), null);
    }

    private async Task<string?> ValidateAsync(
        Guid worldId,
        Guid? categoryId,
        SaveMarkerCategoryRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            request.Name.Trim().Length > 100 ||
            string.IsNullOrWhiteSpace(request.Icon) ||
            request.Icon.Trim().Length > 40 ||
            !HexColorRegex().IsMatch(request.Color.Trim()) ||
            request.SortOrder is < 0 or > 10000)
        {
            return "InvalidCategory";
        }

        var duplicate = await _dbContext.MarkerCategories.AnyAsync(
            category =>
                category.WorldId == worldId &&
                category.Id != categoryId &&
                category.Name.ToLower() ==
                    request.Name.Trim().ToLower(),
            cancellationToken);

        return duplicate ? "DuplicateCategoryName" : null;
    }

    private static MarkerCategoryDto ToDto(MarkerCategory category) =>
        new(
            category.Id,
            category.WorldId,
            category.Name,
            category.Icon,
            category.Color,
            category.SortOrder,
            category.IsActive,
            category.CreatedAt,
            category.UpdatedAt);

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColorRegex();
}
