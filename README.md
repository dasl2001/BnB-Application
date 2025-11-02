# Booking-Application

Detta projekt är ett **Next.js och Hono API** som hanterar **registrering**, **autentisering**, **annonser (properties)** och **bokningar (bookings)** med **Supabase** som backend.

---

## AUTH

**POST** `/api/auth/register`  
Registrera ny användare  

**POST** `/api/auth/login`  
Lägg aven till följande i Headers Content-Type (key) application/json	(value) och apikey (key)	<YOUR_SUPABASE_ANON_KEY> (value) innan du loggar in
Logga in sedan in och hämta access token 

---

## PROPERTIES

**GET** `/api/properties`  
Hämta alla properties  

**GET** `/api/properties/:id`  
Hämta en property  

**GET** `/api/properties/my`  
Hämta användarens egna properties  

**GET** `/api/properties/others`  
Hämta andras (bokningsbara) properties  

**POST** `/api/properties`  
Skapa en ny property  

**PATCH** `/api/properties/:id`  
Uppdatera en property  

**DELETE** `/api/properties/:id`  
Ta bort en property  

**GET** `/api/properties/:id/is-booked`  
Kontrollera om en property är bokad  

---

## BOOKINGS 

**GET** `/api/bookings`  
Hämta användarens bokningar  

**GET** `/api/bookings/:id`  
Hämta en specifik bokning  

**POST** `/api/bookings`  
Skapa en ny bokning  

**PATCH** `/api/bookings/:id`  
Uppdatera en bokning  

**DELETE** `/api/bookings/:id`  
Ta bort en bokning  

---

## Authorization

Alla skyddade rutter kräver en giltig JWT-token i headern:
Authorization: Bearer <access_token>

