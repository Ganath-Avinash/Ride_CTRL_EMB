# SentryX: Two-Wheeler Post-Crash Detection System

![Project Banner](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)
![Hardware](https://img.shields.io/badge/Hardware-ESP32-blue?style=for-the-badge)
![App](https://img.shields.io/badge/Companion_App-React_|_Vite-61DAFB?style=for-the-badge)
![ML](https://img.shields.io/badge/Machine_Learning-TinyML_|_Edge_Impulse-green?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-Firebase_Google_OAuth-orange?style=for-the-badge)

SentryX is an embedded post-crash detection and emergency response system designed for two-wheelers. Utilizing an ESP32 microcontroller, TinyML, and various hardware modules, the system intelligently detects crashes, provides localized audio alerts, and automatically notifies emergency contacts with GPS coordinates if the rider is incapacitated.

## Features

- **Intelligent Crash Detection**: Uses a 6-axis IMU (MPU6050) combined with a TinyML model (trained via Edge Impulse) to distinguish between actual crashes and normal riding events (e.g., potholes, hard braking).
- **Voice Prompts**: Integrates a DFPlayer Mini to play clear audio instructions (e.g., "Impact detected. Alerting emergency contacts in 30 seconds").
- **Automated Emergency SMS**: Uses a GSM module (SIM800L) to send an SOS message containing live GPS coordinates (via U-blox NEO-6M) to pre-configured contacts.
- **Cancellation Mechanism**: Riders have a configurable window (10s / 30s / 60s) to cancel the alert via a physical tactile button or the Companion App if they are unharmed.
- **Companion App**: A full-featured React + Vite frontend that pairs with the ESP32 via BLE. Supports user auth, vehicle profiles, emergency contacts, ride history, and live telemetry.
- **Power Efficient**: Leverages the ESP32's Deep Sleep mode, waking up only upon receiving a hardware interrupt from the IMU during a high-G event.

## Hardware Specifications

The system is built using the following validated components:

| Component | Model/Name | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32 DevKit V1 | USB / BLE | The core processing unit. Handles TinyML inference and logic. |
| **IMU Sensor** | GY-521 (MPU6050) | I2C | 6-axis Accelerometer & Gyroscope. Triggers wake-up interrupts. |
| **GPS Module** | U-blox NEO-6M | UART | Provides real-time latitude/longitude data. |
| **GSM Module** | SIM800L EVB | UART | Sends the emergency SMS over cellular networks. |
| **Voice Module** | DFPlayer Mini | UART | Plays MP3 voice prompts from a MicroSD card. |
| **Speaker** | 3W 8Ohm Mini Speaker | Direct Audio | Outputs the voice prompts. |
| **Power Supply** | 18650 Li-ion (3.7V) | DC Power | Minimum 2000mAh recommended for stable operation. |
| **Charge/Boost** | TP4056 & MT3608 | DC Power | Safely charges the battery and boosts voltage to 5V for GSM/ESP32. |

## Repository Structure

- `/EMB-Dataset/` - Contains raw accelerometer datasets (.csv) used for training the crash detection ML model.
- `/companion-app/` - The React + Vite source code for the smartphone companion app.
- `Roadmap_EMB_CAPS.pdf` - Detailed project roadmap and hardware connectivity guide.
- `EMBEDDED PHASE 1.pdf` - Project documentation and Phase 1 specifications.

## Companion App

The Companion App is a full-featured smartphone interface built with **React**, **TypeScript**, and **Vite**. It communicates with the ESP32 hardware via **Web Bluetooth API (BLE)** and authenticates users via **Firebase Google OAuth**.

### App Architecture

```
App (Auth Gate)
├── Auth Screen           — Google Sign-In, Email/Password Sign-Up
└── [Protected] Main App
    ├── Bottom Navigation — Dashboard | Contacts | Garage | Profile
    ├── Dashboard         — Live telemetry, BLE status, safety score, live map, ride session
    ├── Contacts          — Add/delete emergency contacts, sync to ESP32 over BLE
    ├── Garage            — Vehicle profile (make/model/year/reg/CC), DL upload, device info
    └── Profile           — User info, ride history, SOS duration, sound settings, logout
```

### Key Features

| Screen / Feature | Details |
| :--- | :--- |
| **Auth** | Google Sign-In via Firebase, Email/Password, top-bar theme cycle toggle, custom helmet branding |
| **Dashboard** | Live G-force, speed, pitch, roll · Safety score · Live Leaflet.js map · BLE connect · Ride session tracking · Interactive hardware simulator (Crash / Pothole / Braking) |
| **Emergency Mode** | Edge-to-edge takeover HUD · Web Audio API acoustic alarm · Circular countdown timer · High-visibility "I'M OK" cancel button · Post-dispatch status confirmation |
| **Contacts** | Up to 5 emergency contacts · Family/Friend/Doctor/Other tags · Sync to ESP32 over BLE with live status feedback |
| **Garage** | Custom bike nickname · Make, model, year, reg number, engine CC, color · DL copy upload · Real-time BLE & firmware status |
| **Profile** | Lifetime ride stats (rides count, km, max G) · Ride history log · Configurable SOS timer (10s/30s/60s) · Sound alerts · Multi-theme appearance (Light / Dark / System Default) |
| **Design System** | Apple-inspired minimal aesthetic · Zinc/Slate monochrome palette · Responsive 390px phone-ratio shell with subtle desktop framing |

### Setup Instructions

1. Navigate to the companion app directory:
   ```bash
   cd companion-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Configure Firebase** — Open `src/services/firebaseConfig.ts` and replace the placeholder values with your Firebase project config:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     // ...
   };
   ```
   > Get your config from: [Firebase Console](https://console.firebase.google.com) > Project Settings > Your apps > Web app.
   > Enable **Google** as a Sign-In provider under Authentication > Sign-in method.

4. Run the development server:
   ```bash
   npm run dev
   ```

### BLE Connection (Web Bluetooth)

The app uses the **Web Bluetooth API** to connect to the ESP32.

- Supported on Chrome and Edge (desktop & Android).
- The ESP32 must advertise itself as `SentryX` (or `RIDE_CTRL`).
- BLE Service/Characteristic UUIDs are defined in `src/services/bleService.ts` — update these to match your ESP32 firmware.
- If BLE is not supported by the browser, the app falls back gracefully to a simulated mode.

## Machine Learning Pipeline

The project uses **Edge Impulse** for TinyML model generation.
1. **Data Acquisition**: Time-series accelerometer data is collected and uploaded.
2. **Spectral Analysis**: Extracts peak frequencies and energy from the raw data.
3. **Classification**: A Neural Network or Random Forest classifies the data into normal riding vs. crash events.
4. **Deployment**: The model is exported as an Arduino Library and integrated into the ESP32 firmware.

## Roadmap & Phases

- **Phase 1**: Hardware Assembly & Basic Validation (Testing individual sensors).
- **Phase 2**: Custom Data Collection & ML Finalization (Training the Edge Impulse model).
- **Phase 3**: The "Brain" Integration (Merging ML with hardware logic and state machines).
- **Phase 4**: App & Ecosystem Integration (BLE Server implementation and App connectivity).
- **Phase 5**: Field Testing & Deep Sleep Optimization (Battery efficiency and real-world trials).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
