export const validateEnv = () => {
  const required = ["DATABASE_URL", "JWT_SECRET"];

  required.forEach((key) => {
    if (!process.env[key]) {
      console.error(`❌ Missing env variable: ${key}`);
      process.exit(1);
    }
  });
};