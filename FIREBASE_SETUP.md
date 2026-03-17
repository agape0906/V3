# Googleログイン + 複数デバイス同期 設定手順

1. Firebase コンソールでプロジェクトを作成
2. `Authentication` で `Google` を有効化
3. `Firestore Database` を作成（本番モード推奨）
4. `プロジェクトの設定` → `Webアプリを追加` で構成値を取得
5. `firebase-config.js` に構成値を入力

```js
window.__FIREBASE_CONFIG__ = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
  messagingSenderId: "YOUR_SENDER_ID"
};
```

6. Firestore セキュリティルール（最小例）

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recruitTrackerProStates/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

