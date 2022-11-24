web:
	yarn && yarn build
macos:
	yarn && yarn build
	go mod tidy
    CGO_ENABLED=0 GOOS=darwin GOARCH=amd64  go build -o aline

linux:
	yarn && yarn build
	go mod tidy
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64  go build -o aline

windows:
	yarn && yarn build
	go mod tidy
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64  go build -o aline.exe
