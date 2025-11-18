1. Project Requirements

Build a real-world e-commerce backend with:

Core Features
•	User registration & login (JWT Authentication)
•	Role-based access (ADMIN, CUSTOMER)
•	Product management (CRUD)
•	Category management
•	Wishlist
•	Cart
•	Order placement
•	Payment simulation service (dummy)
•	Image upload (local or S3)
•	Pagination, filtering, sorting
•	Global error handler
•	Request validation
•	CORS, Helmet, Rate limiter
•	Logging (production ready)
•	Environment config loader
•	Folder structure following clean architecture

⸻

2. Technical Requirements

Stack
•	Bun + Elysia.js
•	TypeORM
•	PostgreSQL
•	Zod for validation
•	JWT auth
•	bcrypt password hashing

Code Style
•	TypeScript strict mode
•	Modular, layered architecture
•	Dependency injection where useful
•	DTOs + Services + Controllers pattern

⸻

3. Deliverables (VERY IMPORTANT)

Provide the following in order:

✅ Step 1 — Create project folder structure
•	/src
•	/config
•	/database
•	/modules
•	/user
•	/product
•	/category
•	/cart
•	/wishlist
•	/order
•	/payment
•	/middlewares
•	/utils
•	/core (error, http responses)
•	/index.ts
•	/server.ts

✅ Step 2 — Generate step-by-step setup instructions
•	installing bun
•	installing deps
•	initializing TypeORM
•	configuring env file
•	connecting to PostgreSQL

✅ Step 3 — Provide code templates for:
•	server.ts
•	index.ts
•	db config
•	JWT utils
•	Error handling
•	Middlewares
•	Zod validator wrapper
•	Response formatter

✅ Step 4 — Build each module

For each module (User, Product, Cart, Order, etc):
1.	entity
2.	DTOs
3.	service
4.	controller (Elysia routes)
5.	validators
6.	Bind routes into main index

(Provide complete code.)

⸻

4. Best Practices

Follow:
•	SOLID principles
•	Clean architecture
•	No business logic inside controllers
•	Use services for all operations
•	Use DTOs for strict input validation
•	Use TypeORM migrations
•	Write reusable helper methods
•	Apply error codes
