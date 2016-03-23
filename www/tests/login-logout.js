/**
 * Created by Robin Jobb on 2016-03-15.
 */
/**
 * Created by Robin Jobb on 2016-03-15.
 */
describe('login logout', function() {

    it('should login and logout', function() {
        browser.get('http://localhost:63342/mobileresponsewebbapp/index.html');
        //remove cookie concent
        element(by.css('.cc_btn_accept_all')).click();
        element(by.model('login.username')).sendKeys('catlover');
        element(by.model('login.password')).sendKeys('Temp1234.');
        element(by.css('[value="login"]')).click();
        element(by.css('#menu-trigger')).click();
        element(by.css('.profile-menu')).click();
        var el = element(By.binding('username'));
        expect(el.getText()).toBe('catlover');
        element.all(by.css('.main-menu li')).then(function(items) {
            expect(items.length).toBe(19);
            expect(items[2].getText()).toBe('Logout');
            items[2].click();
        });
        element(by.model('login.username')).sendKeys('done');
    });
});