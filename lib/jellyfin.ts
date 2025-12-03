// lib/jellyfin.ts

export interface JellyfinConfig {
  serverUrl: string;
  username: string;
  password?: string;
  accessToken?: string;
  userId?: string;
}

const CLIENT_INFO =
  'Client="LearningPlatform", Device="Web", DeviceId="unique-device-id", Version="1.0.0"';

export const jellyfinApi = {
  /**
   * 1. Authenticate with the server
   */
  async login(config: JellyfinConfig) {
    // Remove trailing slash if present
    const baseUrl = config.serverUrl.replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': `${CLIENT_INFO}`,
      },
      body: JSON.stringify({
        Username: config.username,
        Pw: config.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to connect to Jellyfin. Check credentials.');
    }

    const data = await response.json();
    return {
      accessToken: data.AccessToken,
      userId: data.SessionInfo.UserId,
      serverUrl: baseUrl,
    };
  },

  /**
   * 2. Fetch Video Items from the User's Library
   * We filter for 'Video' types and ask for 'MediaSources' to get durations.
   */
  async getVideos(baseUrl: string, userId: string, accessToken: string) {
    const params = new URLSearchParams({
      IncludeItemTypes: 'Movie,Video',
      Recursive: 'true',
      Fields: 'MediaSources,Path', // Needed for duration and file path
      SortBy: 'SortName',
    });

    const response = await fetch(
      `${baseUrl}/Users/${userId}/Items?${params.toString()}`,
      {
        headers: {
          'X-Emby-Authorization': `${CLIENT_INFO}, Token="${accessToken}"`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch library.');
    }

    const data = await response.json();
    return data.Items;
  },
};
