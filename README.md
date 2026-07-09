# Console — Interactive Question Builder

A no-build-step web app: set up questions where each option is wired to a
video, an audio clip, or a text response. Students click through one
question at a time, see the response fire immediately, and review every
choice at the end. Submissions are saved to Firestore so you can see what
each student picked.

## Files

- `index.html` — landing page (choose Build or Run)
- `admin.html` / `app-admin.js` — create, edit, delete questions and options
- `quiz.html` / `app-quiz.js` — student-facing quiz + review + submit
- `firebase-config.js` — **replace this with your own Firebase project config**
- `style.css` — shared styling

No npm, no build tool — just open the HTML files in a browser (or host the
folder anywhere static, like Firebase Hosting, GitHub Pages, or Netlify).

## 1. Create your Firebase project

1. Go to https://console.firebase.google.com and create a new project
   (or use an existing one).
2. In the project, click **Build > Firestore Database > Create database**.
   Start in **test mode** while you're setting things up (see the security
   rules section below before you actually use this with real students).
3. In Project Settings, scroll to "Your apps" and click the **</>** (web)
   icon to register a web app. Firebase will show you a config object.

## 2. Paste in your config

Open `firebase-config.js` and replace the placeholder `firebaseConfig`
object with the one Firebase gave you. That's the only file you need to
edit to connect the app to your project.

## 3. Try it

- Open `admin.html` and add a question with at least two options. For each
  option, pick whether it should show a video, play audio, or display text,
  and provide the content:
  - **Video / Audio** — a direct URL to a media file (e.g. something you've
    uploaded to Firebase Storage, YouTube won't work directly since it needs
    a direct file URL — a plain `.mp4`/`.mp3` link works best)
  - **Text** — just type what the student should see
- Open `quiz.html`, enter a name, and click through. Each option's response
  appears the moment it's clicked. At the end you'll see a full review of
  every answer before submitting.
- Submitted runs land in a `submissions` collection in Firestore — open the
  Firebase console's Firestore tab to see them.

## Firestore data shape

```
questions (collection)
  {auto-id} (doc)
    order: number
    text: string
    options: [
      { id, label, type: "video" | "audio" | "text", content }
    ]

submissions (collection)
  {auto-id} (doc)
    studentName: string
    submittedAt: timestamp
    answers: [
      { questionId, questionText, optionId, optionLabel, type, content }
    ]
```

## Security rules (do this before real students use it)

Test mode leaves your database wide open. Before sharing this with a class,
go to **Firestore > Rules** and use something like this — it lets anyone
read questions and submit answers, but only you (via the console, or a
signed-in admin check you add later) can edit questions:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /questions/{questionId} {
      allow read: if true;
      allow write: if false; // edit questions from the Firebase console,
                              // or lock this to an authenticated admin uid
    }
    match /submissions/{submissionId} {
      allow read: if false;   // keep student submissions private by default
      allow create: if true;  // anyone can submit a completed run
      allow update, delete: if false;
    }
  }
}
```

If you want to manage questions from `admin.html` itself (rather than the
Firebase console) once this is live, add Firebase Authentication and scope
the `questions` write rule to your own account's uid instead of `false`.

## Notes

- Everything runs client-side; there's no server component.
- Media files: if you don't have a video/audio host, add **Firebase
  Storage** to the project, upload files there, and use the download URL
  it gives you as the option's content.
- Want a name-your-quiz / multiple-quiz-sets setup instead of one shared
  question list? The data model above is deliberately simple — happy to
  extend it if you outgrow this.
