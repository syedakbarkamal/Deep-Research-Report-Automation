// src/lib/googleAuth.ts
import { gapi } from "gapi-script";

// Updated credentials from your JSON
const CLIENT_ID = "107421267674-gr655uqf9dauop815rvd1e7kadru5fd1.apps.googleusercontent.com";
const API_KEY = "AIzaSyC1tiNIKIq80Ow-SDWwGQJgzpSjT6n00ro";
const DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];
const SCOPES = "https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file";

// Global variables for Google Identity Services
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;
let isInitialized = false;

function loadGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      // Wait a bit for the google object to be fully available
      setTimeout(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          resolve();
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
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
      // First ensure Google Identity Services is loaded
      await loadGoogleIdentityServices();

      // Initialize gapi for API calls (still needed for Docs/Drive APIs)
      gapi.load("client", async () => {
        try {
          console.log("Initializing gapi client...");
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          
          console.log("Loading specific APIs...");
          // Explicitly load the APIs we need
          await gapi.client.load('docs', 'v1');
          await gapi.client.load('drive', 'v3');
          
          console.log("APIs loaded successfully");
          console.log("Available clients:", Object.keys(gapi.client));
          
          // Initialize the new Google Identity Services for OAuth
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
  if (typeof google === 'undefined' || !google.accounts) {
    throw new Error('Google Identity Services not available');
  }
  
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      // Set the access token for gapi client
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

    // Update the callback to resolve/reject the promise
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

export async function createGoogleDoc(
  title: string,
  content: string
) {
  if (!isSignedIn()) throw new Error("User is not signed in");

  const docs = gapi.client.docs;
  const drive = gapi.client.drive;

  try {
    const doc = await docs.documents.create({ title });
    const documentId = doc.result.documentId;

    await docs.documents.batchUpdate({
      documentId,
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content,
          },
        },
      ],
    });

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
