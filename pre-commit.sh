echo "Pre commit check."
echo "👋 Removing 'node_modules' and 'out' folder."
rm -rf ./node_modules ./out
echo "👋 Compiling the project"
npm install
npm run compile
echo "👋 Running the linter."
npm run lint
echo "👋 Running the tests."
npm run test
echo "Pre commit completed."
