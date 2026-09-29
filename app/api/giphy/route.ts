type GiphySearchResponse = {
  data?: Array<{
    id?: string;
    title?: string;
    images?: {
      fixed_width?: { url?: string };
    };
  }>;
};

export async function GET(request: Request) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Add GIPHY_API_KEY to your environment to search GIFs." }, { status: 503 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length > 100) {
    return Response.json({ error: "Enter a search term of 1 to 100 characters." }, { status: 400 });
  }

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "12");
  url.searchParams.set("rating", "g");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return Response.json({ error: "GIPHY could not complete the search." }, { status: 502 });
    }

    const payload = await response.json() as GiphySearchResponse;
    const gifs = (payload.data ?? []).flatMap((gif) => {
      const gifUrl = gif.images?.fixed_width?.url;
      if (!gif.id || !gifUrl) return [];
      return [{ id: gif.id, title: gif.title ?? "GIF", url: gifUrl }];
    });

    return Response.json({ gifs });
  } catch {
    return Response.json({ error: "Unable to reach GIPHY. Try again." }, { status: 502 });
  }
}