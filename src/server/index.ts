import "dotenv/config"
import { createApp } from "./app"

const port = Number(process.env.PORT ?? 3001)
const app = createApp()

app.listen(port, () => {
	console.log(`ScamMesh baseline listening on http://127.0.0.1:${port}`)
})
