git pull
cd /Users/apple/rustworkspace/icpex-frontend
rm -rf canister_ids.json
rm -rf config/production_canister.ids.json
cp canisterId/mutiwallet_test/canister_ids.json ./
cp canisterId/mutiwallet_test/production_canister.ids.json ./config/
dfx identity use icpex
dfx deploy icpl_starter_assets --network ic

