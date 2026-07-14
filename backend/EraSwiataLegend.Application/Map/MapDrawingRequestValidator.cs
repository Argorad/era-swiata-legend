using System.Text.RegularExpressions;

namespace EraSwiataLegend.Application.Map;

public static partial class MapDrawingRequestValidator
{
    public static bool IsValid(SaveMapDrawingStrokeRequest request) =>
        request.Points.Count is >= 2 and <= 5000 && request.Width is >= 1 and <= 80 &&
        HexColor().IsMatch(request.Color) && request.Opacity is >= 0 and <= 1 &&
        request.FontSize is >= 8 and <= 240 && request.SortOrder is >= 0 and <= 100000 &&
        request.Tool is "pen" or "eraser" or "line" or "arrow" or "rectangle" or "ellipse" or "polygon" or "text" &&
        request.DashStyle is "solid" or "dashed" or "dotted" && request.Text.Length <= 2000 &&
        request.Points.All(point => double.IsFinite(point.X) && double.IsFinite(point.Y) &&
            Math.Abs(point.X) <= 1000000 && Math.Abs(point.Y) <= 1000000);

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColor();
}
