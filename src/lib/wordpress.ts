import { getEpisodeNumber } from "./parser";
import Fuse from "fuse.js";

const WORDPRESS_API_URL = "https://uhdmovies.tips/wp-json/wp/v2/posts";
const WORDPRESS_USERNAME = "volx";
const WORDPRESS_PASSWORD = "tmNq mdhA 97Af 686u sbpf cH1v";

// Convert password to application password format
const APPLICATION_PASSWORD = Buffer.from(
  `${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`
).toString("base64");

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
}

export async function searchWordPressPost(searchTerm: string): Promise<WordPressPost[]> {
  try {
    // Clean up the search term by removing special characters and extra spaces
    const cleanSearchTerm = searchTerm
      .replace(/%20/g, ' ') // Replace %20 with spaces
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    const searchUrl = `${WORDPRESS_API_URL}?search=${encodeURIComponent(cleanSearchTerm)}&per_page=100`;
    console.log("🔍 Searching WordPress posts with URL:", searchUrl);
    console.log("🔍 Clean search term:", cleanSearchTerm);
    
    const response = await fetch(searchUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${APPLICATION_PASSWORD}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`);
    }

    const posts: WordPressPost[] = await response.json();
    console.log(`📝 Found ${posts.length} posts matching search term:`, cleanSearchTerm);
    
    // Log the titles of found posts for debugging
    if (posts.length > 0) {
      console.log("📋 Found posts:", posts.map(post => post.title.rendered));
    }
    
    return posts;
  } catch (error) {
    console.error("❌ Error searching WordPress post:", error);
    return [];
  }
}

export async function getWordPressPost(postId: number): Promise<WordPressPost | null> {
  try {
    const url = `${WORDPRESS_API_URL}/${postId}?_fields=id,title,content`;
    console.log("📄 Fetching WordPress post with ID:", postId);
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${APPLICATION_PASSWORD}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`);
    }

    const post = await response.json();
    console.log("✅ Successfully fetched post:", post.title.rendered);
    return post;
  } catch (error) {
    console.error("❌ Error fetching WordPress post:", error);
    return null;
  }
}

export async function updateWordPressPost(
  postId: number,
  content: string,
  title?: string
): Promise<boolean> {
  try {
    const updateUrl = `${WORDPRESS_API_URL}/${postId}`;
    console.log("🔄 Updating WordPress post with ID:", postId);
    
    const updateData: any = {
      content,
      ...(title && { title }),
      status: 'publish',
      meta: {
        _send_to_telegram: 'no' // Disable Telegram sending
      }
    };

    const response = await fetch(updateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${APPLICATION_PASSWORD}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`);
    }

    console.log("✅ Successfully updated post:", postId);
    return true;
  } catch (error) {
    console.error("❌ Error updating WordPress post:", error);
    return false;
  }
}

export function generateEpisodeCode(fileName: string, webContentLink: string): string {
  const episodeNumber = getEpisodeNumber(fileName) ?? "X";
  return `[maxbutton id="2" text="Episode ${episodeNumber}" url="${webContentLink}"]`;
}

export function findMatchingPost(posts: WordPressPost[], fileName: string): WordPressPost | null {
  // Extract the series name from the filename
  const seriesName = fileName.split('.S')[0]
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  console.log("🔍 Looking for post with series name:", seriesName);

  // Configure Fuse.js options
  const options = {
    keys: ['title.rendered'],
    threshold: 0.3, // Lower threshold for more strict matching
    distance: 100,
    includeScore: true,
    minMatchCharLength: 3,
  };

  // Create Fuse instance with the posts
  const fuse = new Fuse(posts, options);

  // Search for the series name
  const results = fuse.search(seriesName);

  if (results.length > 0) {
    const bestMatch = results[0];
    console.log("✅ Found matching post by title:", bestMatch.item.title.rendered);
    console.log("📊 Match score:", bestMatch.score);
    return bestMatch.item;
  }

  console.log("❌ No matching post found for series:", seriesName);
  if (posts.length > 0) {
    console.log("📋 Available posts:", posts.map(post => post.title.rendered));
  }

  return null;
}

export function updatePostContent(content: string, episodeCode: string): string {
  // Find the last episode button in the content
  const lastEpisodeMatch = content.match(/\[maxbutton id="2" text="Episode \d+" url="[^"]+"\s*\]/g);
  if (!lastEpisodeMatch) {
    console.log("❌ No existing episode buttons found in content");
    return content;
  }

  const lastEpisode = lastEpisodeMatch[lastEpisodeMatch.length - 1];
  const lastButtonIndex = content.lastIndexOf(lastEpisode);
  
  if (lastButtonIndex === -1) {
    console.log("❌ Could not find the last episode button in content");
    return content;
  }

  // Insert the new episode code after the last button
  const beforeLastButton = content.substring(0, lastButtonIndex + lastEpisode.length);
  const afterLastButton = content.substring(lastButtonIndex + lastEpisode.length);
  
  // Add a space before the new episode code if there isn't one
  const separator = afterLastButton.startsWith(' ') ? '' : ' ';
  const updatedContent = `${beforeLastButton}${separator}${episodeCode}${afterLastButton}`;

  console.log("✅ Successfully inserted new episode code after last button");
  return updatedContent;
}

export function updatePostTitle(title: string, fileName: string): string {
  const episodeNumber = getEpisodeNumber(fileName);
  if (!episodeNumber) return title;

  // Extract season and episode from filename
  const seasonMatch = fileName.match(/S(\d+)E\d+/i);
  if (!seasonMatch) return title;

  const season = seasonMatch[1];
  const episode = episodeNumber.toString().padStart(2, '0');
  const newEpisodeTag = `[S${season}E${episode} Added]`;

  // Update or add the episode tag in the title
  const updatedTitle = title.replace(/\[S\d+E\d+ Added\]/, newEpisodeTag) || 
                      title.replace(/(1080p)/, `${newEpisodeTag} $1`);

  console.log("✅ Updated title with new episode tag:", newEpisodeTag);
  return updatedTitle;
} 