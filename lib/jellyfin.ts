// lib/jellyfin.ts

export interface JellyfinConfig {
  serverUrl: string;
  username: string;
  password?: string;
  accessToken?: string;
  userId?: string;
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  IsFolder: boolean;
  RunTimeTicks?: number;
  Path?: string;
  MediaSources?: Array<{ Id: string; Container: string; Path: string }>;
  UserData?: {
    Played: boolean;
    PlaybackPositionTicks: number;
  };
}

const CLIENT_INFO =
  'MediaBrowser Client="LearningPlatform", Device="Web", DeviceId="unique-device-id", Version="1.0.0"';

export const jellyfinApi = {
  // 1. Login
  async login(config: JellyfinConfig) {
    const baseUrl = config.serverUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': CLIENT_INFO,
      },
      body: JSON.stringify({
        Username: config.username,
        Pw: config.password || '',
      }),
    });

    if (!response.ok) throw new Error(`Login failed: ${response.statusText}`);
    const data = await response.json();
    return {
      accessToken: data.AccessToken,
      userId: data.SessionInfo.UserId,
      serverUrl: baseUrl,
    };
  },

  // 2. BROWSE
  async browse(
    baseUrl: string,
    userId: string,
    accessToken: string,
    parentId?: string
  ) {
    const params = new URLSearchParams({
      Recursive: 'false',
      Fields: 'Path,IsFolder',
      SortBy: 'SortName',
      ...(parentId && { ParentId: parentId }),
    });

    const response = await fetch(
      `${baseUrl}/Users/${userId}/Items?${params.toString()}`,
      {
        headers: {
          'X-Emby-Authorization': `${CLIENT_INFO}, Token="${accessToken}"`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to browse items.');
    const data = await response.json();
    return data.Items as JellyfinItem[];
  },

  // 3. SYNC
  async getVideos(
    baseUrl: string,
    userId: string,
    accessToken: string,
    parentId: string
  ) {
    const params = new URLSearchParams({
      IncludeItemTypes: 'Movie,Video,Episode',
      Recursive: 'true',
      Fields: 'MediaSources,Path,RunTimeTicks,Overview',
      SortBy: 'SortName',
      ParentId: parentId,
      Limit: '10000', 
    });

    const response = await fetch(
      `${baseUrl}/Users/${userId}/Items?${params.toString()}`,
      {
        headers: {
          'X-Emby-Authorization': `${CLIENT_INFO}, Token="${accessToken}"`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch videos.');
    const data = await response.json();
    return data.Items as JellyfinItem[];
  },
};
