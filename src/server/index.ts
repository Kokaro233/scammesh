import "dotenv/config"
import { createApp } from "./app"

const port = Number(process.env.PORT ?? 3001)
const app = createApp()

app.listen(port, "0.0.0.0", () => {
	console.log(`ScamMesh listening on http://0.0.0.0:${port}`)
})
