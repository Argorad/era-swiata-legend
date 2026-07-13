using EraSwiataLegend.Domain.Entities;
using EraSwiataLegend.Domain.Enums;
using EraSwiataLegend.Domain.Rules;

var tests = new List<(string Name, Action Test)>
{
    ("Folder systemowy nie może być zmieniony", () =>
    {
        var folder = new Folder { Type = FolderType.Archive, Name = "Archive" };
        AssertThrows<InvalidOperationException>(() => folder.Rename("Inna"));
        AssertThrows<InvalidOperationException>(() => folder.MoveTo(Guid.NewGuid()));
    }),
    ("Hierarchia odrzuca przeniesienie do potomka", () =>
    {
        var root = Guid.NewGuid();
        var child = Guid.NewGuid();
        var grandchild = Guid.NewGuid();
        var parents = new Dictionary<Guid, Guid?>
        {
            [root] = null,
            [child] = root,
            [grandchild] = child
        };
        Assert(FolderHierarchyRules.WouldCreateCycle(root, grandchild, parents));
        Assert(!FolderHierarchyRules.WouldCreateCycle(grandchild, root, parents));
    }),
    ("Strona zapamiętuje folder i wraca z Archive/Trash", () =>
    {
        var original = Guid.NewGuid();
        var archive = Guid.NewGuid();
        var page = new Page { FolderId = original, Title = "Kronika" };
        page.MoveTo(archive, true);
        Assert(page.FolderId == archive && page.PreviousFolderId == original);
        page.RestoreTo(original);
        Assert(page.FolderId == original && page.PreviousFolderId is null);
    }),
    ("Trwałe usunięcie strony jest dozwolone tylko w Trash", () =>
    {
        Assert(!KnowledgeLifecycleRules.CanPermanentlyDeletePage(FolderType.Normal));
        Assert(!KnowledgeLifecycleRules.CanPermanentlyDeletePage(FolderType.Archive));
        Assert(KnowledgeLifecycleRules.CanPermanentlyDeletePage(FolderType.Trash));
    }),
    ("Marker mapy odrzuca pozycję poza mapą", () =>
    {
        var marker = new MapMarker();
        AssertThrows<ArgumentOutOfRangeException>(() => marker.Update(
            "Wieża", "", MapMarkerType.Landmark, 1.01, .5, null, null));
        marker.Update("Wieża", "Północna", MapMarkerType.Landmark, .25, .75, null, null);
        Assert(marker.PositionX == .25 && marker.PositionY == .75);
    }),
    ("Marker zachowuje względną pozycję po przesunięciu", () =>
    {
        var marker = new MapMarker();
        marker.Update("Brama", "", MapMarkerType.Place, .1, .2, null, null);
        marker.Move(.95, .05);
        Assert(marker.PositionX == .95 && marker.PositionY == .05);
        AssertThrows<ArgumentOutOfRangeException>(() => marker.Move(-.01, .4));
    }),
    ("Marker wraca z Trash do poprzedniego stanu", () =>
    {
        var marker = new MapMarker();
        marker.Archive();
        marker.MoveToTrash();
        Assert(marker.Status == MapMarkerStatus.Trash);
        Assert(marker.PreviousStatus == MapMarkerStatus.Archived);
        marker.Restore();
        Assert(marker.Status == MapMarkerStatus.Archived);
        Assert(marker.PreviousStatus is null);
    }),
    ("Marker można trwale usunąć wyłącznie z Trash", () =>
    {
        Assert(!KnowledgeLifecycleRules.CanPermanentlyDeleteMarker(MapMarkerStatus.Active));
        Assert(!KnowledgeLifecycleRules.CanPermanentlyDeleteMarker(MapMarkerStatus.Archived));
        Assert(KnowledgeLifecycleRules.CanPermanentlyDeleteMarker(MapMarkerStatus.Trash));
    }),
    ("Zmiana obrazu mapy zachowuje markery", () =>
    {
        var firstImage = Guid.NewGuid();
        var secondImage = Guid.NewGuid();
        var map = new WorldMap();
        map.Markers.Add(new MapMarker { Name = "Port" });
        map.Update("Wybrzeże", "", WorldMapType.Region, firstImage, true);
        map.Update("Wybrzeże", "Nowy skan", WorldMapType.Region, secondImage, true);
        Assert(map.ImageFileId == secondImage);
        Assert(map.Markers.Count == 1);
    }),
    ("Archiwizacja mapy nie usuwa markerów", () =>
    {
        var map = new WorldMap();
        map.Markers.Add(new MapMarker());
        map.Archive();
        Assert(map.Status == WorldMapStatus.Archived && map.Markers.Count == 1);
        map.Restore();
        Assert(map.Status == WorldMapStatus.Active && map.Markers.Count == 1);
    }),
    ("Kategoria markera może zostać wyłączona bez usuwania markerów", () =>
    {
        var category = new MarkerCategory
        {
            Name = "Ruiny",
            Icon = "⌂",
            Color = "#90765d",
            IsActive = true
        };
        category.Markers.Add(new MapMarker());
        category.Update("Ruiny", "⌂", "#90765d", 20, false);
        Assert(!category.IsActive && category.Markers.Count == 1);
    }),
    ("Blokada pozycji markera jest trwałym stanem domenowym", () =>
    {
        var marker = new MapMarker();
        marker.SetPositionLocked(true);
        Assert(marker.IsPositionLocked);
        marker.SetPositionLocked(false);
        Assert(!marker.IsPositionLocked);
    }),
    ("Warstwa obrazu waliduje skalę i zachowuje blokadę", () =>
    {
        var layer = new MapImageLayer();
        layer.Update("Północ", -500, 240, 1.5, 15, 20, true, true, true);
        Assert(layer.IsLocked && layer.PositionX == -500 && layer.Scale == 1.5);
        AssertThrows<ArgumentException>(() =>
            layer.Update("Błędna", 0, 0, 0, 0, 0, true, true, false));
    }),
    ("Konfiguracja siatki mapy ma bezpieczne granice", () =>
    {
        var map = new WorldMap();
        map.ConfigureGrid(true, 64);
        Assert(map.IsGridVisible && map.GridSize == 64);
        AssertThrows<ArgumentOutOfRangeException>(() => map.ConfigureGrid(true, 4));
    }),
    ("Archiwizacja świata zachowuje dane", () =>
    {
        var world = new World();
        world.Folders.Add(new Folder());
        world.Pages.Add(new Page());
        world.Archive();
        Assert(world.Status == WorldStatus.Archived);
        Assert(world.Folders.Count == 1 && world.Pages.Count == 1);
    }),
    ("Nowy folder i plik są domyślnie prywatne", () =>
    {
        Assert(!new Folder().IsVisibleToPlayers);
        Assert(!new FileAttachment().IsVisibleToPlayers);
    }),
    ("Warstwa obrazu waliduje krycie", () =>
    {
        var layer = new MapImageLayer();
        layer.Update("Wybrzeże", 0, 0, 1, 0, 10, true, false, false, .45);
        Assert(Math.Abs(layer.Opacity - .45) < .001);
        AssertThrows<ArgumentException>(() =>
            layer.Update("Błędna", 0, 0, 1, 0, 10, true, false, false, 1.2));
    }),
    ("Zaawansowana siatka zachowuje styl i przyciąganie", () =>
    {
        var map = new WorldMap();
        map.ConfigureGrid(true, 48, "dots", "#f0d080", .7, 2, 10, true, true, "ocean");
        Assert(map.GridStyle == "dots" && map.IsSnapToGridEnabled && map.GridMajorEvery == 10);
        AssertThrows<ArgumentException>(() =>
            map.ConfigureGrid(true, 48, "invalid", "#f0d080", .7, 2, 10, true, true, "ocean"));
    }),
    ("Marker gracza zachowuje autora i domyślną prywatność", () =>
    {
        var userId = Guid.NewGuid();
        var marker = new MapMarker
        {
            IsPlayerMarker = true,
            OwnerUserId = userId,
            AuthorDisplayName = "Aldren"
        };
        Assert(marker.OwnerUserId == userId && marker.AuthorDisplayName == "Aldren");
        Assert(marker.PlayerVisibility == 0 && !marker.IsPublished);
    }),
    ("Warstwa rysunków zachowuje niezależną blokadę i widoczność", () =>
    {
        var map = new WorldMap();
        map.ConfigureDrawingLayer(true, true, false);
        Assert(map.IsDrawingLayerVisible && map.IsDrawingLayerLocked &&
            !map.IsDrawingLayerVisibleToPlayers);
        map.ConfigureDrawingLayer(false, false, true);
        Assert(!map.IsDrawingLayerVisible && !map.IsDrawingLayerLocked &&
            map.IsDrawingLayerVisibleToPlayers);
    }),
    ("Adnotacja ma niezależną kłódkę i opcjonalną ramkę tekstu", () =>
    {
        var annotation = new MapDrawingStroke
        {
            Tool = "text",
            Text = "Stolica",
            IsLocked = true,
            HasTextBorder = false
        };
        Assert(annotation.IsLocked && !annotation.HasTextBorder &&
            annotation.Tool == "text");
    })
};

var failures = 0;
foreach (var (name, test) in tests)
{
    try
    {
        test();
        Console.WriteLine($"PASS: {name}");
    }
    catch (Exception exception)
    {
        failures++;
        Console.Error.WriteLine($"FAIL: {name} — {exception.Message}");
    }
}

Console.WriteLine($"Wynik: {tests.Count - failures}/{tests.Count} testów zaliczonych.");
return failures == 0 ? 0 : 1;

static void Assert(bool condition)
{
    if (!condition) throw new InvalidOperationException("Warunek testu nie został spełniony.");
}

static void AssertThrows<TException>(Action action)
    where TException : Exception
{
    try
    {
        action();
    }
    catch (TException)
    {
        return;
    }

    throw new InvalidOperationException($"Oczekiwano wyjątku {typeof(TException).Name}.");
}
