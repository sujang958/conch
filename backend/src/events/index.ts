import { readdirSync } from "fs"
import { join } from "path"
import { EventHandler, EventHandlerType } from "../models/event"

const events = new Map<string, EventHandlerType>()

for (const filename of readdirSync(join(__dirname, "./")).filter((name) =>
  name.endsWith(".event.ts")
)) {
  const file = require(join(__dirname, filename)).default
  const handlerFile = EventHandler.safeParse(file)

  if (!handlerFile.success) {
    console.warn("Couldn't load an event named", filename)

    continue
  }
  if (events.has(handlerFile.data.name)) {
    console.warn(
      "Duplicated event handler",
      handlerFile.data.name,
      "in",
      filename
    )
  }

  events.set(handlerFile.data.name, handlerFile.data)
}

export default events
