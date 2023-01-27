import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

export const run = (): Promise<void> => {
	// Create the mocha test
	const mocha = new Mocha({
		color: true,
		ui: 'tdd'
	});

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((callback, er) => {
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return er(err);
			}

			// Add files to the test suite
			files.forEach(file => mocha.addFile(path.resolve(testsRoot, file)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						er(new Error(`${failures} tests failed.`));
					} else {
						// eslint-disable-next-line callback-return
						callback();
					}
				});
			} catch (error) {
				console.error(error);
				er(error);
			}
			return null;
		});
	});
};
