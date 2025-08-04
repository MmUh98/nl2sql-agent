
-- Customer Table
CREATE TABLE "Customer" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "FirstName" TEXT NOT NULL,
  "LastName" TEXT NOT NULL,
  "City" TEXT,
  "Country" TEXT,
  "Phone" TEXT
);

-- Order Table
CREATE TABLE "Order" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "OrderDate" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "OrderNumber" TEXT,
  "CustomerId" INTEGER NOT NULL,
  "TotalAmount" REAL DEFAULT 0,
  FOREIGN KEY ("CustomerId") REFERENCES "Customer"("Id")
);

-- OrderItem Table
CREATE TABLE "OrderItem" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "OrderId" INTEGER NOT NULL,
  "ProductId" INTEGER NOT NULL,
  "UnitPrice" REAL NOT NULL DEFAULT 0,
  "Quantity" INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY ("OrderId") REFERENCES "Order"("Id"),
  FOREIGN KEY ("ProductId") REFERENCES "Product"("Id")
);

-- Product Table
CREATE TABLE "Product" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "ProductName" TEXT NOT NULL,
  "SupplierId" INTEGER NOT NULL,
  "UnitPrice" REAL DEFAULT 0,
  "Package" TEXT,
  "IsDiscontinued" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("SupplierId") REFERENCES "Supplier"("Id")
);

-- Supplier Table
CREATE TABLE "Supplier" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "CompanyName" TEXT NOT NULL,
  "ContactName" TEXT,
  "ContactTitle" TEXT,
  "City" TEXT,
  "Country" TEXT,
  "Phone" TEXT,
  "Fax" TEXT
);

-- Playlist Table (added)
CREATE TABLE "Playlist" (
  "Id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "Name" TEXT NOT NULL
);
