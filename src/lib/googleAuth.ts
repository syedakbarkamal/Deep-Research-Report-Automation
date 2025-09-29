// src/lib/googleAuth.ts
import { gapi } from "gapi-script";

// Updated credentials from your JSON
const CLIENT_ID =
  "107421267674-gr655uqf9dauop815rvd1e7kadru5fd1.apps.googleusercontent.com";
const API_KEY = "AIzaSyC1tiNIKIq80Ow-SDWwGQJgzpSjT6n00ro";
const DISCOVERY_DOCS = [
  "https://docs.googleapis.com/$discovery/rest?version=v1",
];
const SCOPES =
  "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file";

// Global variables for Google Identity Services
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
let isInitialized = false;

function loadGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== "undefined" && google.accounts) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      setTimeout(() => {
        if (typeof google !== "undefined" && google.accounts) {
          resolve();
        } else {
          reject(new Error("Google Identity Services failed to load"));
        }
      }, 100);
    };
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function initGoogleClient(onInit?: () => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (isInitialized) {
      if (onInit) onInit();
      resolve();
      return;
    }

    try {
      await loadGoogleIdentityServices();

      gapi.load("client", async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });

          await gapi.client.load("docs", "v1");
          await gapi.client.load("drive", "v3");

          initGIS();
          isInitialized = true;
          if (onInit) onInit();
          resolve();
        } catch (error) {
          console.error("Error initializing gapi:", error);
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function initGIS() {
  if (typeof google === "undefined" || !google.accounts) {
    throw new Error("Google Identity Services not available");
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      gapi.client.setToken({ access_token: accessToken });
    },
  });
}

export function signIn(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Token client not initialized"));
      return;
    }

    tokenClient.callback = (tokenResponse) => {
      if (tokenResponse.error) {
        reject(new Error(tokenResponse.error));
        return;
      }

      accessToken = tokenResponse.access_token;
      gapi.client.setToken({ access_token: accessToken });
      resolve();
    };

    tokenClient.requestAccessToken();
  });
}

export function signOut(): Promise<void> {
  return new Promise((resolve) => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null;
        gapi.client.setToken(null);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export function isSignedIn(): boolean {
  return accessToken !== null;
}

// ✅ Updated createGoogleDoc with logo + formatting
export async function createGoogleDoc(
  title: string,
  content: string,
  logoUrl?: string
) {
  if (!isSignedIn()) throw new Error("User is not signed in");

  const docs = gapi.client.docs;
  const drive = gapi.client.drive;

  try {
    // ✅ Create empty doc
    const doc = await docs.documents.create({
      resource: { title },
    });

    const documentId = doc.result.documentId;

    const requests: any[] = [];

    let headerId: string | null = null;

    // ✅ Step 1: Create header if logo provided
    if (logoUrl) {
      const headerResponse = await docs.documents.batchUpdate({
        documentId,
        resource: {
          requests: [
            {
              createHeader: {
                type: "DEFAULT",
              },
            },
          ],
        },
      });

      // Get headerId from response
      const headerObj = headerResponse.result.replies?.[0]?.createHeader;
      headerId = headerObj?.headerId || null;

      if (headerId) {
        // ✅ Step 2: Insert logo inside header
        requests.push({
          insertInlineImage: {
            location: { segmentId: headerId, index: 0 },
            uri: logoUrl,
            objectSize: {
              height: { magnitude: 60, unit: "PT" },
              width: { magnitude: 120, unit: "PT" },
            },
          },
        });

        requests.push({
          updateParagraphStyle: {
            range: {
              segmentId: headerId,
              startIndex: 0,
              endIndex: 1,
            },
            paragraphStyle: { alignment: "START" },
            fields: "alignment",
          },
        });
      }
    }

    // ✅ Step 3: Insert report body content
    const contentRequests = parseContentToRequests(content, 1);
    requests.push(...contentRequests);

    // Apply all content requests
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        resource: { requests },
      });
    }

    // ✅ Step 4: Return doc link
    const file = await drive.files.get({
      fileId: documentId,
      fields: "id, webViewLink",
    });

    return file.result.webViewLink;
  } catch (err) {
    console.error("Error creating Google Doc:", err);
    throw err;
  }
}



function parseContentToRequests(content: string, startIndex = 1) {
  const lines = content.split("\n");
  const requests: any[] = [];
  let currentIndex = startIndex;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line - preserve spacing
    if (line.trim() === "") {
      requests.push({
        insertText: { location: { index: currentIndex }, text: "\n" },
      });
      currentIndex += 1;
      continue;
    }

    // Page break
    if (line === "<pagebreak>") {
      requests.push({ insertPageBreak: { location: { index: currentIndex } } });
      currentIndex += 1;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      const text = line.replace("# ", "").trim() + "\n";
      const startPos = currentIndex;
      
      requests.push({
        insertText: { location: { index: currentIndex }, text },
      });
      
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: startPos, endIndex: startPos + text.length - 1 },
          paragraphStyle: { 
            namedStyleType: "HEADING_1",
            spaceAbove: { magnitude: 12, unit: "PT" },
            spaceBelow: { magnitude: 6, unit: "PT" }
          },
          fields: "namedStyleType,spaceAbove,spaceBelow",
        },
      });
      
      currentIndex += text.length;
      continue;
    }

    // Heading 2 (like "Product/Service Category", "US Market Overview")
    if (line.startsWith("## ")) {
      const text = line.replace("## ", "").trim() + "\n";
      const startPos = currentIndex;
      
      requests.push({
        insertText: { location: { index: currentIndex }, text },
      });
      
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: startPos, endIndex: startPos + text.length - 1 },
          paragraphStyle: { 
            namedStyleType: "HEADING_2",
            spaceAbove: { magnitude: 10, unit: "PT" },
            spaceBelow: { magnitude: 4, unit: "PT" }
          },
          fields: "namedStyleType,spaceAbove,spaceBelow",
        },
      });
      
      currentIndex += text.length;
      continue;
    }

    // Heading 3 (like "Market Size and Growth")
    if (line.startsWith("### ") || line.startsWith("#### ")) {
      const text = line.replace(/^#{3,4} /, "").trim() + "\n";
      const startPos = currentIndex;
      
      requests.push({
        insertText: { location: { index: currentIndex }, text },
      });
      
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: startPos, endIndex: startPos + text.length - 1 },
          paragraphStyle: { 
            namedStyleType: "HEADING_3",
            spaceAbove: { magnitude: 8, unit: "PT" },
            spaceBelow: { magnitude: 3, unit: "PT" }
          },
          fields: "namedStyleType,spaceAbove,spaceBelow",
        },
      });
      
      currentIndex += text.length;
      continue;
    }

    // Lines with inline formatting (bold/italic)
    const hasInlineFormatting = /\*\*[^*]+\*\*|\*[^*]+\*/.test(line);
    
    if (hasInlineFormatting) {
      const segments = parseInlineFormatting(line);
      const lineStartIndex = currentIndex;
      const fullText = segments.map(s => s.text).join("") + "\n";
      
      // Insert text
      requests.push({
        insertText: { location: { index: currentIndex }, text: fullText },
      });
      
      // Apply inline formatting
      let segmentOffset = 0;
      for (const segment of segments) {
        const segmentStart = lineStartIndex + segmentOffset;
        const segmentEnd = segmentStart + segment.text.length;
        
        if (segment.bold) {
          requests.push({
            updateTextStyle: {
              range: { startIndex: segmentStart, endIndex: segmentEnd },
              textStyle: { bold: true },
              fields: "bold",
            },
          });
        }
        
        if (segment.italic) {
          requests.push({
            updateTextStyle: {
              range: { startIndex: segmentStart, endIndex: segmentEnd },
              textStyle: { italic: true },
              fields: "italic",
            },
          });
        }
        
        segmentOffset += segment.text.length;
      }
      
      currentIndex += fullText.length;
      continue;
    }

    // Regular paragraph text
    const text = line + "\n";
    requests.push({
      insertText: { location: { index: currentIndex }, text },
    });
    currentIndex += text.length;
  }

  return requests;
}

function parseInlineFormatting(line: string): Array<{ text: string; bold?: boolean; italic?: boolean }> {
  const segments: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
  let remaining = line;
  
  while (remaining.length > 0) {
    // Match bold (**text**)
    const boldMatch = remaining.match(/^\*\*([^*]+?)\*\*/);
    if (boldMatch) {
      segments.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    
    // Match italic (*text*) - but not if it's part of **
    const italicMatch = remaining.match(/^\*([^*]+?)\*/);
    if (italicMatch && !remaining.startsWith("**")) {
      segments.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    
    // Match text until next * or end of string
    const textMatch = remaining.match(/^[^*]+/);
    if (textMatch) {
      segments.push({ text: textMatch[0] });
      remaining = remaining.slice(textMatch[0].length);
      continue;
    }
    
    // Single asterisk that doesn't match patterns
    segments.push({ text: remaining[0] });
    remaining = remaining.slice(1);
  }
  
  return segments;
}
