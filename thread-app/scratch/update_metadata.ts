import { db } from "./src/db";
import { eventTypes } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const events = await db.select().from(eventTypes);
  for (const event of events) {
    if (!event.metadata) {
      await db.update(eventTypes).set({
        metadata: {
          services: [
            { id: "s1", name: "Extra Consulting (15m)", durationMinutes: 15 },
            { id: "s2", name: "Deep Dive Session (30m)", durationMinutes: 30 },
            { id: "s3", name: "Follow-up Report (No extra time)", durationMinutes: 0 }
          ]
        }
      }).where(eq(eventTypes.id, event.id));
      console.log(`Updated event ${event.slug}`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
