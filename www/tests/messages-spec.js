/**
 * Created by Robin Jobb on 2016-03-15.
 */
/**
 * Created by Robin Jobb on 2016-03-15.
 */
describe('angularjs homepage todo list', function() {

    it('should add a todo', function() {
        browser.get('http://localhost:63342/mobileresponsewebbapp/index.html');

        element(by.model('login.username')).sendKeys('catlover');
        element(by.model('login.password')).sendKeys('Temp1234.');
        element(by.css('[value="login"]')).click();


        element(by.css('#menu-trigger')).click();

        //element(by.css('#toggle-menu')).click();

        //element(by.css('.profile-menu')).click();
        //expect(child.getText()).toBe('catlover');


       // var todoList = element.all(by.repeater('todo in todoList.todos'));
       // expect(todoList.count()).toEqual(3);
       // expect(todoList.get(2).getText()).toEqual('write first protractor test');

        // You wrote your first test, cross it off the list
       // todoList.get(2).element(by.css('input')).click();
        //var completedAmount = element.all(by.css('.done-true'));
       // expect(completedAmount.count()).toEqual(2);
    });
});