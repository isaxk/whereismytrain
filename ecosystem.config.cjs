module.exports = {
	apps: [
		{
			name: 'darwin-kafka-client',
			script: './kafka/index.ts',
			interpreter: 'npx',
			interpreter_args: 'tsx',
			watch: true
		}
	]
};
