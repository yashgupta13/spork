# Graph Report - FasonRat  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1571 nodes · 3525 edges · 112 communities (92 shown, 20 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90b830a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- org.json.JSONObject
- .getInstance
- KeyloggerManager
- PermissionSetupController
- HVncManager
- NotificationRelayService
- frontend/src/types/index.ts
- frontend/src/services/socket.ts
- MainService
- FilesEncryptDecrypt
- SocketCommandRouter.java
- SocketService
- android.view.accessibility.AccessibilityNodeInfo
- dependencies
- routes/auth.ts
- scripts
- db/index.ts
- backend/src/services/socket.ts
- compilerOptions
- compilerOptions
- devDependencies
- KeepAliveWorker
- src/index.ts
- android.content.Context
- android.os.Bundle
- builder.ts
- android.app.Activity
- compilerOptions
- PermissionManager
- Files.tsx
- FasonAccessibilityService
- HomeManager
- device.ts
- shared.tsx
- devDependencies
- App.tsx
- Inspector.tsx
- FileUpload
- setup.ts
- SocketClient
- ScreenCaptureProxyActivity.java
- api.ts
- dependencies
- AppLayout.tsx
- navigation.ts
- export.ts
- OemAutoStartHelper.java
- frontend/package.json
- ConfirmDialog.tsx
- useDeviceData.ts
- backend/package.json
- Keylogger.tsx
- Setup.tsx
- allowScripts
- scripts
- store/auth.ts
- theme.ts
- scripts
- Builder.tsx
- Calls.tsx
- Gps.tsx
- drizzle.config.ts
- gradlew
- Hvnc.tsx
- Wifi.tsx
- Logs.tsx
- Unlock.tsx
- Settings.tsx
- Users.tsx
- devices.ts
- frontend/tsconfig.json
- better-sqlite3
- drizzle-orm
- fastify
- @fastify/cors
- @fastify/multipart
- @fastify/rate-limit
- geoip-lite
- pino
- pino-pretty
- socket.io
- docker-entrypoint.sh
- GateOpener

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 44 edges
2. `HVncManager` - 42 edges
3. `CameraManager` - 37 edges
4. `MainService` - 36 edges
5. `SocketService` - 35 edges
6. `HVncAccessibilityService` - 35 edges
7. `PermissionSetupController` - 33 edges
8. `SocketCommandRouter` - 32 edges
9. `PermissionManager` - 32 edges
10. `SocketClient` - 31 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `authMiddleware()`  [INFERRED]
  backend/src/index.ts → backend/src/middleware/auth.ts
- `main()` --indirect_call--> `authRoutes()`  [INFERRED]
  backend/src/index.ts → backend/src/routes/auth.ts
- `main()` --indirect_call--> `builderRoutes()`  [INFERRED]
  backend/src/index.ts → backend/src/routes/builder.ts
- `main()` --indirect_call--> `deviceRoutes()`  [INFERRED]
  backend/src/index.ts → backend/src/routes/device.ts
- `main()` --indirect_call--> `setupGuard()`  [INFERRED]
  backend/src/index.ts → backend/src/routes/setup.ts

## Import Cycles
- None detected.

## Communities (112 total, 20 thin omitted)

### Community 0 - "org.json.JSONObject"
Cohesion: 0.05
Nodes (23): android.location.Location, android.location.LocationListener, com.google.android.gms.location.FusedLocationProviderClient, com.google.android.gms.location.LocationCallback, JSONObject, SocketCommandRouter, JSONObject, JSONObject (+15 more)

### Community 1 - ".getInstance"
Cohesion: 0.06
Nodes (24): android.media.AudioRecord, android.media.MediaRecorder, androidx.camera.core.ImageAnalysis, androidx.camera.core.ImageCapture, androidx.camera.core.ImageProxy, androidx.camera.lifecycle.ProcessCameraProvider, androidx.camera.video.Recorder, androidx.camera.video.Recording (+16 more)

### Community 2 - "KeyloggerManager"
Cohesion: 0.05
Nodes (18): android.database.sqlite.SQLiteDatabase, android.database.sqlite.SQLiteOpenHelper, android.net.wifi.ScanResult, android.net.wifi.WifiManager, android.view.accessibility.AccessibilityEvent, KeyloggerAccessibility, JSONArray, KeyloggerManager (+10 more)

### Community 3 - "PermissionSetupController"
Cohesion: 0.17
Nodes (8): android.graphics.drawable.GradientDrawable, android.widget.Button, android.widget.FrameLayout, android.widget.TextView, Button, PermissionSetupController, GradientDrawable, TextView

### Community 4 - "HVncManager"
Cohesion: 0.06
Nodes (22): android.accessibilityservice.GestureDescription, android.annotation.SuppressLint, android.hardware.display.VirtualDisplay, android.media.MediaCodec, android.media.MediaFormat, android.media.projection.MediaProjection, android.os.HandlerThread, BufferInfo (+14 more)

### Community 5 - "NotificationRelayService"
Cohesion: 0.09
Nodes (13): android.service.notification.NotificationListenerService, android.service.notification.StatusBarNotification, ComponentName, AutoStartResult, FAILED, OPENED_APP_DETAILS, OPENED_AUTOSTART, ComponentPair (+5 more)

### Community 6 - "frontend/src/types/index.ts"
Cohesion: 0.06
Nodes (39): ALL_PERMISSIONS, ApiResponse, AppEntry, AuthUser, CallRecord, CameraDevice, ClientDevice, ClientFile (+31 more)

### Community 7 - "frontend/src/services/socket.ts"
Cohesion: 0.05
Nodes (26): BuilderProgress, BuilderProgressListener, builderProgressListeners, CameraStreamListener, cameraStreamListeners, CommandStatusListener, commandStatusListeners, DataChangeListener (+18 more)

### Community 8 - "MainService"
Cohesion: 0.10
Nodes (11): android.app.Service, android.content.ClipboardManager, android.os.IBinder, ClipboardMonitor, Handler, JSONObject, Intent, Override (+3 more)

### Community 9 - "FilesEncryptDecrypt"
Cohesion: 0.12
Nodes (6): FileManager, JSONArray, JSONObject, FileModify, FilesEncryptDecrypt, javax.crypto.SecretKey

### Community 10 - "SocketCommandRouter.java"
Cohesion: 0.20
Nodes (9): android.app.Application, android.app.Notification, android.location.LocationManager, android.os.Handler, FasonApp, Protocol, AppList, CallsManager (+1 more)

### Community 11 - "SocketService"
Cohesion: 0.11
Nodes (3): SocketService, CmdType, getMimeType()

### Community 12 - "android.view.accessibility.AccessibilityNodeInfo"
Cohesion: 0.05
Nodes (20): android.graphics.Rect, android.view.accessibility.AccessibilityNodeInfo, HVncAccessibilityService, SignatureCounters, State, CLICK_FINAL, CLICK_NEXT, DONE (+12 more)

### Community 13 - "dependencies"
Cohesion: 0.07
Nodes (29): axios, clsx, dependencies, axios, clsx, jszip, leaflet, lucide-react (+21 more)

### Community 14 - "routes/auth.ts"
Cohesion: 0.15
Nodes (21): hashPasswordScrypt, verifyPasswordScrypt(), authMiddleware(), verifySessionToken(), authRoutes(), fastify, FastifyInstance, FastifyRequest (+13 more)

### Community 15 - "scripts"
Cohesion: 0.07
Nodes (27): concurrently, author, description, devDependencies, concurrently, engines, node, license (+19 more)

### Community 16 - "db/index.ts"
Cohesion: 0.15
Nodes (19): closeDb(), DB, initDb(), runMigrations(), account, buildRecords, clientData, clientFiles (+11 more)

### Community 17 - "backend/src/services/socket.ts"
Cohesion: 0.13
Nodes (17): defaultConfig, runtimeConfig, dbHelpers, clients, hasPermission(), canAccessDevice(), checkDeviceAccess(), FILE_TYPE_MAP (+9 more)

### Community 18 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+16 more)

### Community 19 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+15 more)

### Community 20 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+15 more)

### Community 21 - "KeepAliveWorker"
Cohesion: 0.22
Nodes (5): androidx.annotation.NonNull, androidx.work.Worker, Override, KeepAliveWorker, Result

### Community 22 - "src/index.ts"
Cohesion: 0.26
Nodes (19): loadPersistedSettings(), parseConfigValue(), updateConfig(), getDb(), seedDefaultUser(), __dirname, FRONTEND_DIST, getLanIp() (+11 more)

### Community 23 - "android.content.Context"
Cohesion: 0.14
Nodes (14): android.content.BroadcastReceiver, android.content.Context, android.content.Intent, android.telephony.SmsMessage, androidx.work.WorkerParameters, BootReceiver, Intent, Override (+6 more)

### Community 24 - "android.os.Bundle"
Cohesion: 0.21
Nodes (3): android.os.Bundle, Override, MainActivity

### Community 25 - "builder.ts"
Cohesion: 0.17
Nodes (19): createBuildDir(), DATA_DIR, __dirname, ensureDataDir(), __filename, paths, ROOT_DIR, getSqliteDb() (+11 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 29 - "Files.tsx"
Cohesion: 0.12
Nodes (8): DataActionItem, DataActionsMenuProps, FileIcon(), FilesPage(), formatModifiedDate(), getFileExt(), getFileTypeLabel(), MenuAction

### Community 30 - "FasonAccessibilityService"
Cohesion: 0.23
Nodes (4): android.accessibilityservice.AccessibilityService, android.view.accessibility.AccessibilityWindowInfo, FasonAccessibilityService, Override

### Community 31 - "HomeManager"
Cohesion: 0.20
Nodes (4): android.view.View, android.webkit.WebView, android.widget.ProgressBar, HomeManager

### Community 32 - "device.ts"
Cohesion: 0.23
Nodes (16): canAccessDevice(), ClientRow, CMD_PERMISSIONS, deviceRoutes(), formatClient(), getPageData(), PAGE_PERMISSIONS, safeJsonParse() (+8 more)

### Community 33 - "shared.tsx"
Cohesion: 0.11
Nodes (10): commandStatusConfig, DevicePageHeaderAction, DevicePageHeaderProps, EmptyStateProps, ErrorAlertProps, GridItemCardProps, LoadingSkeletonProps, SectionCardProps (+2 more)

### Community 34 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, drizzle-kit, tsx, @types/adm-zip, @types/better-sqlite3, @types/geoip-lite, @types/node, typescript (+9 more)

### Community 35 - "App.tsx"
Cohesion: 0.13
Nodes (3): App(), ErrorBoundary, root

### Community 36 - "Inspector.tsx"
Cohesion: 0.18
Nodes (14): A11yNode, A11yTree, ACTION_IDS, Announcement, findNodeById(), flattenTree(), InspectorPage(), nodeArea() (+6 more)

### Community 37 - "FileUpload"
Cohesion: 0.24
Nodes (3): FileUpload, JSONObject, java.net.HttpURLConnection

### Community 38 - "setup.ts"
Cohesion: 0.33
Nodes (11): buildAuth(), getAuth(), readOrCreateSecret(), getConfig(), plugins(), checkSetupSteps(), generateDeviceSecret(), isSetupComplete() (+3 more)

### Community 39 - "SocketClient"
Cohesion: 0.16
Nodes (4): Config, Override, SocketClient, NetworkCallback

### Community 40 - "ScreenCaptureProxyActivity.java"
Cohesion: 0.38
Nodes (4): androidx.activity.ComponentActivity, androidx.activity.result.ActivityResultLauncher, Override, ScreenCaptureProxyActivity

### Community 41 - "api.ts"
Cohesion: 0.15
Nodes (13): api, AUTH_WHITELIST, authApi, builderApi, clientsApi, configApi, dashboardApi, fetchAuthBlob() (+5 more)

### Community 42 - "dependencies"
Cohesion: 0.15
Nodes (13): adm-zip, dependencies, adm-zip, better-auth, @fastify/cookie, fastify-plugin, @fastify/static, sharp (+5 more)

### Community 43 - "AppLayout.tsx"
Cohesion: 0.24
Nodes (5): Header(), themeOptions, MobileNav(), MobileNavProps, Sidebar()

### Community 44 - "navigation.ts"
Cohesion: 0.20
Nodes (6): DEVICE_TABS, DeviceTabItem, NAV_ITEMS, NavItem, QUICK_ACTIONS, QuickAction

### Community 45 - "export.ts"
Cohesion: 0.33
Nodes (8): csvEscape(), downloadFile(), exportCSV(), exportJSON(), exportZIP(), toCSV(), toJSON(), ZipFileEntry

### Community 46 - "OemAutoStartHelper.java"
Cohesion: 0.33
Nodes (3): android.content.ComponentName, android.net.Uri, SMSManager

### Community 47 - "frontend/package.json"
Cohesion: 0.22
Nodes (7): engines, node, name, private, type, version, APP_VERSION

### Community 49 - "ConfirmDialog.tsx"
Cohesion: 0.25
Nodes (3): ConfirmDialogProps, PasswordDialogProps, PromptDialogProps

### Community 50 - "useDeviceData.ts"
Cohesion: 0.25
Nodes (5): CacheEntry, CommandStatus, DeviceDataState, pageCache, UseDeviceDataOptions

### Community 52 - "backend/package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, type, version

### Community 55 - "Keylogger.tsx"
Cohesion: 0.33
Nodes (5): EVENT_BADGES, EVENT_FILTERS, getDateLabel(), KeyloggerPage(), Keystroke

### Community 56 - "Setup.tsx"
Cohesion: 0.29
Nodes (3): SetupStatus, SetupSteps, Step

### Community 57 - "allowScripts"
Cohesion: 0.33
Nodes (6): allowScripts, better-sqlite3@12.11.1, esbuild@0.18.20, esbuild@0.25.12, esbuild@0.28.1, sharp@0.33.5

### Community 58 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, db:migrate, db:seed, dev, start

### Community 60 - "store/auth.ts"
Cohesion: 0.47
Nodes (5): AuthState, isValidPermission(), safeParseUser(), useAuthStore, VALID_ROLES

### Community 61 - "theme.ts"
Cohesion: 0.47
Nodes (5): applyTheme(), getSystemTheme(), Theme, ThemeState, useThemeStore

### Community 62 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 64 - "Builder.tsx"
Cohesion: 0.40
Nodes (3): BUILD_STEPS, BuildStep, STEP_LABELS

### Community 65 - "Calls.tsx"
Cohesion: 0.70
Nodes (4): CallsPage(), formatDuration(), getCallIcon(), getCallType()

### Community 66 - "Gps.tsx"
Cohesion: 0.50
Nodes (3): defaultIcon, formatTime(), GpsPage()

### Community 67 - "drizzle.config.ts"
Cohesion: 0.50
Nodes (3): DATA_DIR, __dirname, __filename

### Community 68 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 70 - "Wifi.tsx"
Cohesion: 0.83
Nodes (3): getSignalColor(), getSignalStrength(), WifiPage()

### Community 111 - "GateOpener"
Cohesion: 0.50
Nodes (3): Gate, GateOpener, FunctionalInterface

## Knowledge Gaps
- **317 isolated node(s):** `FastifyInstance`, `ApiResponse`, `CommandPayload`, `DB`, `TransferChunk` (+312 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HVncAccessibilityService` connect `android.view.accessibility.AccessibilityNodeInfo` to `SocketCommandRouter.java`, `FasonAccessibilityService`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `HVncManager` connect `HVncManager` to `ScreenCaptureProxyActivity.java`, `SocketCommandRouter.java`, `android.content.Context`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `FasonAccessibilityService` connect `FasonAccessibilityService` to `org.json.JSONObject`, `KeyloggerManager`, `HVncManager`, `SocketCommandRouter.java`, `android.view.accessibility.AccessibilityNodeInfo`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `FastifyInstance`, `ApiResponse`, `CommandPayload` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `org.json.JSONObject` be split into smaller, more focused modules?**
  _Cohesion score 0.05221017514595496 - nodes in this community are weakly interconnected._
- **Should `.getInstance` be split into smaller, more focused modules?**
  _Cohesion score 0.06022408963585434 - nodes in this community are weakly interconnected._
- **Should `KeyloggerManager` be split into smaller, more focused modules?**
  _Cohesion score 0.054203180785459264 - nodes in this community are weakly interconnected._