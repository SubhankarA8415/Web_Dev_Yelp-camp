# 🏕️ YelpCamp – Campground Review Web Application

A full-stack **MERN-style project with EJS templates**, built during my early web development journey.  
This app allows users to create, view, review, edit, and delete campgrounds.  
Inspired by Colt Steele’s Web Developer Bootcamp project, upgraded with additional features and deployed on **Render**.

---

# ✨ Features

## 👤 User Authentication
- Manual **username + password authentication**
- Login / Register / Logout
- Password hashing for security
- Only logged-in users can create or review campgrounds

---

## 🏕️ Campground Management
Logged-in users can:
- Create new campgrounds  
- Add **multiple images** per campground  
- Add **location, description, and price**  
- View all campgrounds in a list  
- View individual campground details  

### 🔒 Authorization
- Only the **owner of a campground** can:
  - Edit campground details  
  - Delete the campground  

Ownership is verified via user ID → campground model relation.

---

## 📍 Interactive Map (MapTiler)
- Campgrounds displayed on a **MapTiler-powered interactive map**
- Map pin for each campground
- Coordinates fetched through campground location data
- Beautiful UI with zoom and navigation controls

---

## ⭐ Review System
Logged-in users can:
- Add a **star rating** (1–5)
- Add a **text comment**
- View all reviews on the campground details page
- Delete their own reviews
