db.users.updateOne(
  { email: "admin@example.com" },
  {
    $set: {
      name: "Admin",
      email: "admin@example.com",
      password: "$2b$10$9kcvqE1nvOOYRbSmqmPzgOCR3WyuF1gSz4BXUarrth/9HIL5GLsC.",
      role: "admin",
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
    },
  },
  { upsert: true }
);
