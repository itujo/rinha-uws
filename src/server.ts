import "dotenv/config";
import postgres from "postgres";
import { App } from "uWebSockets.js";

const app = App();
const port = Number(process.env.PORT || 3000);

const sql = postgres({
	host: "/var/run/postgresql",
	user: process.env.POSTGRES_USER,
	pass: process.env.POSTGRES_PASSWORD,
	db: process.env.POSTGRES_DB,
});

sql`SELECT 1;`;

app.post("/clientes/:id/transacoes", async (res, req) => {
	const id = req.getParameter(0);
	let data = "";

	res.onAborted(() => {
		console.log("Request was aborted by the client");
	});

	res.onData((chunk, isLast) => {
		data += Buffer.from(chunk).toString();

		if (isLast) {
			const { valor, tipo, descricao } = JSON.parse(data);

			processTransaction(sql, id, valor, tipo, descricao)
				.then((transactionResult) => {
					res.cork(() => {
						res.writeHeader("Content-Type", "application/json");
						res.end(JSON.stringify(transactionResult));
					});
				})
				.catch((error) => {
					res.cork(() => {
						if (error.message === "404") {
							res.writeStatus("404");
						} else {
							res.writeStatus("422");
						}
						res.end(JSON.stringify({ error: error.message }));
					});
				});
		}
	});
});

app.get("/clientes/:id/extrato", async (res, req) => {
	res.onAborted(() => {
		console.log("Request was aborted by the client");
	});

	const id = req.getParameter(0);
	const clienteId = parseInt(id, 10);

	if (Number.isNaN(clienteId)) {
		throw new Error("404");
	}

	try {
		const cliente =
			await sql`SELECT limite FROM clientes WHERE id = ${clienteId}`;

		if (cliente.count === 0) throw new Error("404");

		const { limite } = cliente[0];

		const transacoes = await sql`
            SELECT valor, tipo, descricao, realizada_em
            FROM transacoes
            WHERE cliente_id = ${clienteId}
            ORDER BY realizada_em DESC
            LIMIT 10
        `;

		const saldoAtual = await sql`
            SELECT valor as total
            FROM saldos
            WHERE cliente_id = ${clienteId}
        `;

		const saldo = saldoAtual[0].total || 0;

		const dataExtrato = new Date().toISOString();

		const resposta = {
			saldo: {
				total: saldo,
				data_extrato: dataExtrato,
				limite: limite,
			},
			ultimas_transacoes: transacoes.map((transacao) => ({
				valor: transacao.valor,
				tipo: transacao.tipo,
				descricao: transacao.descricao,
				realizada_em: transacao.realizada_em.toISOString(),
			})),
		};

		res.cork(() => {
			res.writeHeader("Content-Type", "application/json");
			res.end(JSON.stringify(resposta));
		});
	} catch (error: any) {
		res.cork(() => {
			if (error.message === "404") {
				res.writeStatus("404");
			} else {
				res.writeStatus("422");
			}
			res.end(JSON.stringify({ error: error.message }));
		});
	}
});

app.listen(port, async (token) => {
	if (token) {
		console.log(`[🚀]: Worker server running on port ${port}`, token);
	} else {
		console.log(`[❌]: Failed to start worker server on port ${port}`);
	}
});

async function processTransaction(
	sql: postgres.Sql,
	id: string,
	valor: number,
	tipo: string,
	descricao: string,
) {
	if (
		!valor ||
		valor <= 0 ||
		!Number.isInteger(valor) ||
		!["c", "d"].includes(tipo) ||
		descricao.length > 10 ||
		descricao.length < 1
	) {
		throw new Error("422");
	}

	const transactionResult = await sql.begin(async (sql: postgres.Sql) => {
		const cliente =
			await sql`SELECT limite FROM clientes WHERE id = ${+id} FOR UPDATE`;

		if (cliente.count === 0) throw new Error("404");

		const { limite } = cliente[0];

		const { saldo } = (
			await sql`SELECT valor AS saldo FROM saldos WHERE cliente_id = ${+id} FOR UPDATE`
		)[0];

		const novoSaldo = saldo + (tipo === "c" ? valor : -valor);

		if (novoSaldo < -limite) throw new Error("422");

		await sql`UPDATE saldos SET valor = ${novoSaldo} WHERE cliente_id = ${+id}`;
		await sql`INSERT INTO transacoes (cliente_id, valor, tipo, descricao) VALUES (${id}, ${valor}, ${tipo}, ${descricao})`;

		return { limite, saldo: novoSaldo };
	});

	return transactionResult;
}
