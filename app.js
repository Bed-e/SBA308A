// app.js

const form = document.getElementById("search-form");
const results = document.getElementById("results");
let spotifyAccessToken = "";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const artistName = document.getElementById("artist-name").value;
  await searchReleases(artistName);
});

// Function to get Spotify access token
async function getSpotifyAccessToken() {
  const clientId = "37eb412b506948bebc7a4ad19c242308"; // Replace with your Spotify client ID
  const clientSecret = "93704f0a6e754b3e92c02fb36e1f6a5b"; // Replace with your Spotify client secret

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to retrieve Spotify access token");
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
  } catch (error) {
    console.error("Error fetching Spotify access token:", error);
    // Handle error gracefully, e.g., show an error message to the user
  }
}

// Call the getSpotifyAccessToken function on app start
getSpotifyAccessToken();

async function searchReleases(artistName) {
  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(
    artistName
  )}&type=artist&token=WLcpnOmTSaBoBiayxBXjDTDLPQNeaJlSOFxlzLMG`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "YourAppName/1.0 +http://yourappurl.com",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Discogs data");
    }

    const data = await response.json();
    displayArtists(data.results);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Handle error gracefully, e.g., show an error message to the user
  }
}

function displayArtists(artists) {
  results.innerHTML = "";
  artists.forEach((artist) => {
    const artistDiv = document.createElement("div");
    artistDiv.classList.add("release");
    artistDiv.innerHTML = `
      <img src="${artist.cover_image}" alt="${artist.title}">
      <h3>${artist.title}</h3>
    `;
    artistDiv.addEventListener("click", () => displayAlbums(artist));
    results.appendChild(artistDiv);
  });
}

async function displayAlbums(artist) {
  results.innerHTML = ""; // Clear previous content

  try {
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      artist.title
    )}&type=artist&limit=1`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error("Failed to fetch Spotify artist data");
    }

    const searchData = await searchResponse.json();
    if (searchData.artists.items.length > 0) {
      const spotifyArtistId = searchData.artists.items[0].id;

      const albumsUrl = `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums`;
      const albumsResponse = await fetch(albumsUrl, {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      });

      if (!albumsResponse.ok) {
        throw new Error("Failed to fetch Spotify albums");
      }

      const albumsData = await albumsResponse.json();
      displayAlbumsData(albumsData.items, artist.title);
    } else {
      placeholder.innerHTML += "<p>No Spotify artist found.</p>";
    }
  } catch (error) {
    console.error("Error fetching albums from Spotify:", error);
    // Handle error gracefully, e.g., show an error message to the user
  }
}

async function displayAlbumsData(albums, artistName) {
  // Create and append the header text element
  const headerText = document.createElement("h2");
  headerText.textContent = `Albums by ${artistName}`;
  headerText.classList.add("albums-header");
  results.appendChild(headerText);

  // Create and append the albums container element
  const albumsContainer = document.createElement("div");
  albumsContainer.classList.add("albums-container");
  results.appendChild(albumsContainer);

  albums.forEach((album) => {
    const albumDiv = document.createElement("div");
    albumDiv.classList.add("release");
    albumDiv.innerHTML = `
          <img src="${album.images[0]?.url || ""}" alt="${album.name}">
          <h3>${album.name}</h3>
          <p>Released: ${album.release_date}</p>
        `;
    albumsContainer.appendChild(albumDiv);
  });
}
