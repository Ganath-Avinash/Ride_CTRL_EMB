# Ride CTRL: Two-Wheeler Post-Crash Detection System

![Project Banner](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)
![Hardware](https://img.shields.io/badge/Hardware-ESP32-blue?style=for-the-badge)
![App](https://img.shields.io/badge/Companion_App-React_|_Vite-61DAFB?style=for-the-badge)
![ML](https://img.shields.io/badge/Machine_Learning-TinyML_|_Edge_Impulse-green?style=for-the-badge)

Ride CTRL is an embedded post-crash detection and emergency response system designed for two-wheelers. Utilizing an ESP32 microcontroller, TinyML, and various hardware modules, the system intelligently detects crashes, provides localized audio alerts, and automatically notifies emergency contacts with GPS coordinates if the rider is incapacitated.

## Features

- **Intelligent Crash Detection**: Uses a 6-axis IMU (MPU6050) combined with a TinyML model (trained via Edge Impulse) to distinguish between actual crashes and normal riding events (e.g., potholes, hard braking).
- **Voice Prompts**: Integrates a DFPlayer Mini to play clear audio instructions (e.g., "Impact detected. Alerting emergency contacts in 30 seconds").
- **Automated Emergency SMS**: Uses a GSM module (SIM800L) to send an SOS message containing live GPS coordinates (via U-blox NEO-6M) to pre-configured contacts.
- **Cancellation Mechanism**: Riders have a 30-second window to cancel the alert via a physical tactile button or the Companion App if they are unharmed.
- **Companion App**: A modern React + Vite frontend that pairs with the ESP32 via BLE. It allows users to configure emergency contacts, view system status, and acts as a secondary cancellation interface.
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

The Companion App is built using **React**, **TypeScript**, and **Vite**. It communicates with the ESP32 hardware via Bluetooth Low Energy (BLE).

### Setup Instructions

1. Navigate to the companion app directory:
   ```bash
   cd companion-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### App Features
- **Dashboard**: Displays real-time mock telemetry and safety scores.
- **Settings**: Interface to save up to 3 emergency contact numbers (syncs to ESP32 EEPROM).
- **Pairing Screen**: Simple UI to connect the app to the helmet/bike hardware.

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
