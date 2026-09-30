import { db } from "../src/db";
import { bookings } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allBookings = await db.select().from(bookings);
  for (const b of allBookings) {
    console.log(b.guestName, b.startTime);
  }
  process.exit(0);
}
main();
