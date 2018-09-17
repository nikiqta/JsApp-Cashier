$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars', 'hbs');
        // Navigation
        this.get('#/home', getWelcomePage);
        this.get('index.html', getWelcomePage);

        function getWelcomePage(ctx) {
            if (!auth.isAuth()) {
                ctx.loadPartials({
                    loginForm: './templates/forms/loginForm.hbs',
                    registerForm: './templates/forms/registerForm.hbs',
                    footer: './templates/common/footer.hbs'
                }).then(function () {
                    this.partial('./templates/welcome-anonymous.hbs');
                });
            } else {
                ctx.redirect('#/receipt/view');
            }
        }

        // User Session
        this.post('#/register', function (ctx) {
            let username = ctx.params.usernameRegister;
            let password = ctx.params.passwordRegister;
            let repeatPass = ctx.params.passwordRegisterCheck;

            if (username.length < 5) {
                notify.showError("Username must be atleast five symbols");
            } else if (password.trim() === "" || repeatPass.trim() === "") {
                notify.showError("Can not read from empty fields");
            } else if (password !== repeatPass) {
                notify.showError("Passwords must match!");
            } else {
                auth.register(username, password)
                    .then(function (userData) {
                        auth.saveSession(userData);
                        notify.showInfo('User registration successful!');
                        ctx.redirect('#/receipt/view');
                    })
                    .catch(notify.handleError);
            }

        });
        this.post('#/login', function (ctx) {
            let username = ctx.params.usernameLogin;
            let password = ctx.params.passwordLogin;

            if (username.trim() !== "" && password.trim() !== "") {
                if (username.length < 5) {
                    notify.showError("Username must be atleast five symbols");
                }  else {
                    auth.login(username, password)
                        .then(function (userData) {
                            auth.saveSession(userData);
                            notify.showInfo('Login successful!');
                            ctx.redirect('#/receipt/view');
                        })
                        .catch(notify.handleError);
                }
            } else {
                notify.showError("Can not read from empty input fields!");
            }
        });

        this.get('#/logout', function (ctx) {
            auth.logout()
                .then(function (data) {
                    sessionStorage.clear();
                    notify.showInfo("Logout successful!");
                    ctx.redirect('#/home');
                });
        });

        // View All Receipt
        this.get('#/receipt/view', function (ctx) {
            let userId = sessionStorage.getItem('userId');

           receipts.getActiveReceipt(userId)
               .then(function (info) {
                   let receiptId;
                   if(info.length === 0){
                       let newTask = receipts.createReceipt(true, 0, 0);
                       Promise.all([newTask])
                           .then(function ([data]) {
                               console.log(data);
                               receiptId = data._id;
                           })
                           .catch(notify.handleError);
                   } else {
                       receiptId = info[0]._id;
                   }
                   ctx.receiptId = receiptId;

               let entriesData = receipts.getEntriesByReceiptId(receiptId);
               Promise.all([entriesData])
                   .then(function ([entries]) {
                       if(entries.length !== 0){
                           ctx.total = 0;
                           ctx.entryCount = 0;
                           entries.forEach((e) => {
                               e.subTotal = (Number(e.qty) * Number(e.price)).toFixed(2);
                               ctx.total += Number(e.subTotal);
                               ctx.entryCount++;
                           });
                           ctx.total = Math.round(ctx.total * 100) / 100;
                           ctx.entries = entries;
                       }
                       ctx.username = sessionStorage.getItem('username');
                       ctx.loadPartials({
                           header: './templates/common/header.hbs',
                           addEntryForm: './templates/receipts/addEntryForm.hbs',
                           createReceiptForm: './templates/receipts/createReceiptForm.hbs',
                           entry: './templates/receipts/entry.hbs',
                           footer: './templates/common/footer.hbs'
                       }).then(function () {
                           this.partial('./templates/receipts/viewCurrentReceipt.hbs');
                       });
                   })
                   .catch(notify.handleError);
               })
               .catch(notify.handleError);
        });

        this.post('#/add/entry', function (ctx) {
            let type = ctx.params.type;
            let qty = Number(ctx.params.qty);
            let price = Number(ctx.params.price);

            if (type.trim() === "") {
                notify.showError("The type must be a valid String");
            } else if (typeof qty !== "number") {
                notify.showError("The qunatity must be a valid Number");
            } else if (typeof price !== "number") {
                notify.showError("The qunatity must be a valid Number");
            } else {
                let receiptId = ctx.params.receiptId;
                                entries.addEntry(type, qty, price, receiptId)
                    .then(function (data) {
                        notify.showInfo("Entry added!");
                        ctx.redirect('#/receipt/view');
                    })
                    .catch(notify.handleError);
            }

        });

        this.post('#/checkout/receipt', function (ctx) {
              let receiptId = ctx.params.receiptId;
              let total = ctx.params.total;
              let productCount = ctx.params.entryCounter;
              let active = false;

              if (Number(productCount) > 0) {
                  receipts.commitReceipt(active, productCount, total, receiptId)
                      .then(function (respond) {
                          console.log(respond);
                          notify.showInfo("Receipt checked out!");
                          ctx.redirect('#/create');
                      })
                      .catch(notify.handleError);
              } else {
                  notify.showError("There are no items to checkout!");
              }
        });

        this.get('#/delete/entry/:id', function (ctx) {
            let entryId = ctx.params.id;
            entries.deleteEntry(entryId)
                .then(function () {
                    notify.showInfo("Entry removed!");
                    ctx.redirect('#/receipt/editor');
                })
                .catch(notify.handleError);
        });

        this.get('#/create', function (ctx) {
            receipts.createReceipt(true, 0, 0)
                .then(function (data) {
                 console.log(data);
                 window.history.go(0);
                 ctx.redirect('#/receipt/view');
                })
                .catch(notify.handleError);
        });

        this.get('#/overview' , function (ctx) {
             let userId = sessionStorage.getItem('userId');
            receipts.getMyReceipts(userId)
                .then(function (receipts) {
                    ctx.totalAmount = 0;
                    receipts.forEach((p) => {
                    p.date = new Date(p._kmd.ect).toDateString();
                    ctx.totalAmount += Number(p.total);
                    });

                    ctx.totalAmount = Math.round(Number(ctx.totalAmount) * 100) / 100;
                    ctx.allReceipts = receipts;
                    ctx.username = sessionStorage.getItem('username');

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        receipt: './templates/overview/receipt.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/overview/overviewReceipts.hbs');
                    });

                })
                .catch(notify.handleError);
        });

        this.get('#/details/:id', function (ctx) {
            let receiptId = ctx.params.id;

            let entries = receipts.getEntriesByReceiptId(receiptId)
                .then(function (currentEntries) {
                    currentEntries.forEach((e) => {
                      e.subTotal = (Number(e.qty) * Number(e.price)).toFixed(2);
                    });

                    ctx.entries = currentEntries;
                    ctx.username = sessionStorage.getItem('username');

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        receiptDetail: './templates/details/receiptDetail.hbs',
                        footer: './templates/common/footer.hbs'
                    }).then(function () {
                        this.partial('./templates/details/detailsPage.hbs');
                    });
                })
                .catch(notify.handleError);
        });

        this.get('#/editor', function (ctx) {
            ctx.redirect('#/receipt/view');
        })

    });
    
    app.run();
});