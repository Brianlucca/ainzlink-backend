# AinzLink - Backend API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

## 📝 Project Overview

This repository contains the backend service for AinzLink, a powerful and feature-rich URL shortener. It's a robust Node.js application built with Express, designed to be scalable, secure, and real-time.

The architecture supports a full suite of link management features through a RESTful API, while also providing live statistic updates to connected clients via a WebSocket layer managed by Socket.IO. All data is persisted in a highly scalable and real-time NoSQL database, Cloud Firestore. A key design principle is the "account-less" management system, where each created link is paired with a secret admin token, empowering users to manage their links without the need for traditional user registration.

---

## ✨ Core Features

* **RESTful API:** A clean and predictable API for all link operations.
* **Advanced Link Creation:** Supports custom aliases, password protection, and expiration dates.
* **Secure, Token-based Management:** Each link is manageable only through a unique, secret admin token, ensuring that only the creator can edit or delete their links.
* **Real-time Click Tracking:** Utilizes WebSockets (via Socket.IO) to push live click-count updates to authorized clients.
* **Secure Password Handling:** Link passwords are never stored in plaintext; they are securely hashed using `bcrypt`.
* **Scalable Database:** Leverages Cloud Firestore for a flexible, scalable, and real-time data layer.

---

## 🏗️ Architecture & Technology

* **Core Framework:** **Node.js** and **Express.js** form the foundation of the server, providing a fast and minimalist framework for building the API.
* **Database:** **Cloud Firestore** (from Firebase) was chosen for its excellent scalability, flexible data model, and powerful real-time capabilities, which are leveraged by the WebSocket layer.
* **Real-time Layer:** **Socket.IO** is integrated with the core HTTP server to manage persistent WebSocket connections. The server listens for changes in the Firestore database and pushes updates to subscribed clients, enabling features like the live click counter on the admin page.
* **Security:**
    * **Admin Tokens:** A 32-character `nanoid` is generated upon link creation to serve as a secret key for all management operations (update, delete, view stats).
    * **Password Hashing:** The `bcrypt` library is used to hash all link passwords before they are stored, ensuring data security.
* **Modular Structure:** The codebase is organized into a clean, modular structure (`/config`, `/routes`, `/controllers`), promoting separation of concerns and maintainability.

---

