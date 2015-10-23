'use strict';

var $ = require('teaspoon');
var unexpected = require('unexpected');
var unexpectedReactShallow = require('unexpected-react-shallow');
var expect = unexpected.clone().installPlugin(unexpectedReactShallow);
var sinon = require('sinon');

var React = require('react');
var director = require('director');
var TodoApp = require('../src/TodoApp.jsx');
var Container = require('../src/Container.jsx');
var TodoHeader = require('../src/TodoHeader.jsx');
var TodoItems = require('../src/TodoItems.jsx');
var TodoItem = require('../src/TodoItem.jsx');
var TodoFooter = require('../src/TodoFooter.jsx');
var TodoModel = require('../src/TodoModel.js');

function extractRoute(linkElem) {
  return linkElem.href.replace(/.*#/, '');
}

// TODO: find out why `director.Router.prototype` has less methods when run in Node.js
if(!director.Router.prototype.init) {
  director.Router.prototype.init = function() {};
}

describe('TodoMVC App', function() {
  var model, router;

  beforeEach(function() {
    router = new director.Router();
    localStorage.clear();
  });

  describe('UI bindings', function() {
    var todoItem;

    beforeEach(function() {
      model = new TodoModel();
      model.addTodo('Item #1');
      todoItem = model.todos[0];
    });

    beforeEach(function() {
      this.handleTodoAdded = TodoApp.prototype.__reactAutoBindMap.handleTodoAdded;
      this.handleToggle = TodoApp.prototype.__reactAutoBindMap.handleToggle;
      this.handleToggleAll = TodoApp.prototype.__reactAutoBindMap.handleToggleAll;
      this.handleClearCompleted = TodoApp.prototype.__reactAutoBindMap.handleClearCompleted;
      this.handleDestroy = TodoApp.prototype.__reactAutoBindMap.handleDestroy;
    });

    afterEach(function() {
      TodoApp.prototype.__reactAutoBindMap.handleTodoAdded = this.handleTodoAdded;
      TodoApp.prototype.__reactAutoBindMap.handleToggle = this.handleToggle;
      TodoApp.prototype.__reactAutoBindMap.handleToggleAll = this.handleToggleAll;
      TodoApp.prototype.__reactAutoBindMap.handleClearCompleted = this.handleClearCompleted;
      TodoApp.prototype.__reactAutoBindMap.handleDestroy = this.handleDestroy;
    });

    it('allows the user to add items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleTodoAdded = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleTodoAdded');

      // when
      var inputBox = todoApp.render().find('input.new-todo');
      inputBox.dom().value = 'Item #1';
      inputBox.trigger('keyDown', {key: 'Enter', keyCode: 13, which: 13});

      // then
      sinon.assert.calledWith(handleTodoAdded, 'Item #1');
    });

    it('does not allow the user to add emtpy items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleTodoAdded = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleTodoAdded');

      // when
      var inputBox = todoApp.render().find('input.new-todo');
      inputBox.dom().value = '';
      inputBox.trigger('keyDown', {key: 'Enter', keyCode: 13, which: 13});

      // then
      sinon.assert.notCalled(handleTodoAdded);
    });

    it('allows the user to check active items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleToggle = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleToggle');

      // when
      todoApp.render().find('.todo-list .toggle').trigger('change', {'target': {'checked': true}});

      // then
      sinon.assert.calledWith(handleToggle, todoItem);
    });

    it('allows the user to destroy items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleDestroy = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleDestroy');

      // when
      todoApp.render().find('.destroy').trigger('click');

      // then
      sinon.assert.calledWith(handleDestroy, todoItem);
    });

    it('allows the user to mark all items as completed', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleToggleAll = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleToggleAll');

      // when
      todoApp.render().find('.toggle-all').trigger('change', {'target': {'checked': true}});

      // then
      sinon.assert.calledOnce(handleToggleAll);
    });

    it('allows the user to clear completed items', function() {
      // given
      todoItem.completed = true;
      var todoApp = $(<TodoApp model={model} router={router}/>);
      var handleClearCompleted = sinon.stub(TodoApp.prototype.__reactAutoBindMap, 'handleClearCompleted');

      // when
      todoApp.render().find('button.clear-completed').trigger('click');

      // then
      sinon.assert.calledOnce(handleClearCompleted);
    });

    it('allows the user to view all items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(extractRoute(todoApp.render().find('a.all').dom()), 'to equal', '/');
    });

    it('allows the user to view active items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(extractRoute(todoApp.render().find('a.active').dom()), 'to equal', '/active');
    });

    it('allows the user to view completed items', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(extractRoute(todoApp.render().find('a.completed').dom()), 'to equal', '/completed');
    });
  });

  describe('when the Todo list start off empty', function() {
    beforeEach(function() {
      model = new TodoModel();
    });

    it('only renders a header when there are no items in the list', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(todoApp.shallowRender()[0], 'to have rendered with all children',
        <Container componentName="TodoApp">
          <TodoHeader/>
        </Container>
      );
    });

    it('allows an item to be added to the list', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoHeader')[0].props.onTodoAdded('Item #1');

      // then
      expect(todoApp.shallowRender()[0], 'to have rendered with all children',
        <Container componentName="TodoApp">
          <TodoHeader/>
          <TodoItems activeTodoCount={1}>
            <TodoItem title="Item #1" completed={false}/>
          </TodoItems>
          <TodoFooter count={1} completedCount={0} nowShowing="all"/>
        </Container>
      );
    });
  })

  describe('when the Todo list starts off with a single active item', function() {
    var todoItem;

    beforeEach(function() {
      model = new TodoModel();
      model.addTodo('Item #1');
      todoItem = model.todos[0];
    });

    it('starts off with a completed count of zero', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoFooter count={1} completedCount={0}/>
      );
    });

    it('updates the summary information when an items checkbox is ticked', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoItem')[0].props.onToggle(0);

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoFooter count={0} completedCount={1}/>
      );
    });

    it('removes the items list and footer when the last item is removed', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoItem')[0].props.onDestroy(0);

      // then
      expect(todoApp.shallowRender()[0], 'to have rendered with all children',
        <Container componentName="TodoApp">
          <TodoHeader/>
        </Container>
      );
    });

    it('updates the footer information when the completed filter is clicked', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender();
      router.dispatch('on', '/completed');

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoFooter nowShowing="completed"/>
      );
    });

    it('adds new items to the bottom of the list', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoHeader')[0].props.onTodoAdded('Item #2');

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoItems activeTodoCount={2}>
          <TodoItem title="Item #1" completed={false}/>
          <TodoItem title="Item #2" completed={false}/>
        </TodoItems>
      );
    });
  });

  describe('when the Todo list contains multiple items', function() {
    beforeEach(function() {
      model = new TodoModel();
      model.addTodo('Item #1');
      model.addTodo('Item #2');
      model.addTodo('Item #3');
    });

    it('marks all items as done when the toggle-all arrow is clicked', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoItems')[0].props.onToggleAll({'target': {'checked': true}});

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoItems activeTodoCount={0}>
          <TodoItem title="Item #1" completed={true}/>
          <TodoItem title="Item #2" completed={true}/>
          <TodoItem title="Item #3" completed={true}/>
        </TodoItems>
      );
    });
  });

  describe('when the Todo list contains a mixture of completed and active items', function() {
    beforeEach(function() {
      model = new TodoModel();
      model.addTodo('Item #1');
      model.addTodo('Item #2');
      model.addTodo('Item #3');
      model.todos[1].completed = true;
    });

    it('shows all items by default', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // then
      expect(todoApp.shallowRender()[0], 'to contain with all children',
        <TodoItems activeTodoCount={2}>
          <TodoItem title="Item #1" completed={false}/>
          <TodoItem title="Item #2" completed={true}/>
          <TodoItem title="Item #3" completed={false}/>
        </TodoItems>
      );
    });

    it('does not show active items when the completed view is used', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender();
      router.dispatch('on', '/completed');

      // then
      expect(todoApp.shallowRender()[0], 'to contain with all children',
        <TodoItems activeTodoCount={2}>
          <TodoItem title="Item #2" completed={true}/>
        </TodoItems>
      );
    });

    it('does not show completed items when the active view is used', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender();
      router.dispatch('on', '/active');

      // then
      expect(todoApp.shallowRender()[0], 'to contain with all children',
        <TodoItems activeTodoCount={2}>
          <TodoItem title="Item #1" completed={false}/>
          <TodoItem title="Item #3" completed={false}/>
        </TodoItems>
      );
    });

    it('removes only completed items when clear-completed is clicked', function() {
      // given
      var todoApp = $(<TodoApp model={model} router={router}/>);

      // when
      todoApp.shallowRender().find('TodoFooter')[0].props.onClearCompleted();

      // then
      expect(todoApp.shallowRender()[0], 'to contain',
        <TodoItems activeTodoCount={2}>
          <TodoItem title="Item #1" completed={false}/>
          <TodoItem title="Item #3" completed={false}/>
        </TodoItems>
      );
    });
  });
});
