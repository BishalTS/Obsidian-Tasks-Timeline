import moment from 'moment';
import * as React from 'react';
import { getFileTitle } from '../../../dataview-util/dataview';
import { doneDateSymbol, dueDateSymbol, innerDateFormat, prioritySymbols, recurrenceSymbol, scheduledDateSymbol, startDateSymbol, TaskDataModel } from '../utils/tasks';
import * as Icons from './asserts/icons';
import { CreateNewTaskContext, TodayFocusEventHandlers, UserOptionContext } from './context';
import { TaskItemView } from './taskitemview';

const defaultDateProps = {
    date: moment(),
}

type DateViewProps = Readonly<typeof defaultDateProps> & TodayContentProps;

export class DateView extends React.Component<DateViewProps> {
    render(): React.ReactNode {
        const thisYear = this.props.date.format("YYYY");
        const thisDate = this.props.date.format(innerDateFormat);
        const taskList = this.props.tasksOfToday;
        return (
            <div className='details' data-year={thisYear} data-types={[...new Set(taskList.map((t => t.status)))].join(" ")}>
                <DateHeader thisDate={thisDate} />
                {this.props.date.isSame(moment(), 'date') ?
                    <TodayContent tasksOfToday={this.props.tasksOfToday} /> :
                    <NormalDateContent tasksOfToday={this.props.tasksOfToday} date={this.props.date} />}
            </div>)
    }
}

const defaultTodayContentProps = {
    tasksOfToday: [] as TaskDataModel[],
}
type TodayContentProps = Readonly<typeof defaultTodayContentProps> & CountersProps & QuickEntryProps;

class TodayContent extends React.Component<TodayContentProps> {
    render(): React.ReactNode {
        return (
            <div className='content'>
                <TodayFocus />
                <Counters />
                <QuickEntry />
                {this.props.tasksOfToday.map(t => <TaskItemView taskItem={t} />)}
            </div>
        )
    }
}

type DateHeaderProps = {
    thisDate: string,
}
class DateHeader extends React.Component<DateHeaderProps> {
    render(): React.ReactNode {
        return (
            <div className='dateLine'>
                <div className='date'>{this.props.thisDate}</div>
                <div className='weekday'></div>
            </div>
        )
    }
}

type NormalDateContentProps = {
    tasksOfToday: TaskDataModel[],
    date: moment.Moment,
}

class NormalDateContent extends React.Component<NormalDateContentProps> {

    render(): React.ReactNode {
        const taskList = this.props.tasksOfToday;
        return (
            <div className='content'>
                {taskList.map((t, i) => <TaskItemView taskItem={t} key={i} />)}
            </div>)
    }
}

const defaultQuickEntryProps = {
};

type QuickEntryProps = Readonly<typeof defaultQuickEntryProps>;

class QuickEntry extends React.Component<QuickEntryProps> {
    private newTaskInput;
    private okButton;
    private fileSelect;
    private quickEntryPanel;
    constructor(props: QuickEntryProps) {
        super(props);

        this.onQuickEntryFileSelectChange = this.onQuickEntryFileSelectChange.bind(this);
        this.onQuickEntryNewTaskInput = this.onQuickEntryNewTaskInput.bind(this);
        this.onQuickEntryNewTaskKeyUp = this.onQuickEntryNewTaskKeyUp.bind(this);
        this.onQuickEntryPanelBlur = this.onQuickEntryPanelBlur.bind(this);
        this.onQuickEntryPanelFocus = this.onQuickEntryPanelFocus.bind(this);

        this.newTaskInput = React.createRef<HTMLInputElement>();
        this.okButton = React.createRef<HTMLButtonElement>();
        this.fileSelect = React.createRef<HTMLSelectElement>();
        this.quickEntryPanel = React.createRef<HTMLDivElement>();
    }

    onQuickEntryFileSelectChange() {
        this.newTaskInput.current?.focus();
    }

    onQuickEntryNewTaskKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter") return;
        this.okButton.current?.click();
    }

    onQuickEntryNewTaskInput() {
        const input = this.newTaskInput.current;
        if (!input) return;
        const newTask = input.value;
        // Icons
        if (newTask.includes("due ")) { input.value = newTask.replace("due", dueDateSymbol) };
        if (newTask.includes("start ")) { input.value = newTask.replace("start", startDateSymbol) };
        if (newTask.includes("scheduled ")) { input.value = newTask.replace("scheduled", scheduledDateSymbol) };
        if (newTask.includes("done ")) { input.value = newTask.replace("done", doneDateSymbol) };
        if (newTask.includes("high ")) { input.value = newTask.replace("high", prioritySymbols.High) };
        if (newTask.includes("medium ")) { input.value = newTask.replace("medium", prioritySymbols.Medium) };
        if (newTask.includes("low ")) { input.value = newTask.replace("low", prioritySymbols.Low) };
        if (newTask.includes("repeat ")) { input.value = newTask.replace("repeat", recurrenceSymbol) };
        if (newTask.includes("recurring ")) { input.value = newTask.replace("recurring", recurrenceSymbol) };

        // Dates
        if (newTask.includes("today ")) { input.value = newTask.replace("today", moment().format("YYYY-MM-DD")) };
        if (newTask.includes("tomorrow ")) { input.value = newTask.replace("tomorrow", moment().add(1, "days").format("YYYY-MM-DD")) };
        if (newTask.includes("yesterday ")) { input.value = newTask.replace("yesterday", moment().subtract(1, "days").format("YYYY-MM-DD")) };

        // In X days/weeks/month/years
        const futureDate = newTask.match(/(in)\W(\d{1,3})\W(days|day|weeks|week|month|years|year) /);
        if (futureDate && futureDate.length > 3) {
            const value: number = parseInt(futureDate[2]);
            const unit = futureDate[3] as moment.unitOfTime.Base;
            const date = moment().add(value, unit).format("YYYY-MM-DD[ ]")
            input.value = newTask.replace(futureDate[0], date);
        };

        // Next Weekday
        const weekday = newTask.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday) /);
        if (weekday) {
            const weekdays = ["", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
            const dayINeed = weekdays.indexOf(weekday[1]);
            if (moment().isoWeekday() < dayINeed) {
                input.value = newTask.replace(weekday[1], moment().isoWeekday(dayINeed).format("YYYY-MM-DD"));
            } else {
                input.value = newTask.replace(weekday[1], moment().add(1, 'weeks').isoWeekday(dayINeed).format("YYYY-MM-DD"));
            };
        };

        input.focus();
    }

    onQuickEntryPanelFocus() {
        this.quickEntryPanel.current?.addClass("focus");
    }

    onQuickEntryPanelBlur() {
        this.quickEntryPanel.current?.removeClass("focus");
    }

    render(): React.ReactNode {

        return (
            <div className='quickEntryPanel' ref={this.quickEntryPanel}>
                <div className='left'>
                    <UserOptionContext.Consumer>{options => {
                        return (
                            <select className='fileSelect' ref={this.fileSelect} aria-label='Select a note to add a new task to'
                                onChange={this.onQuickEntryFileSelectChange} value={options.select}>
                                {options.taskFiles.map((f, i) => {
                                    const secondParentFolder =
                                        f.split("/")[f.split("/").length - 3] == null ? "" : "… / ";
                                    const parentFolder =
                                        f.split("/")[f.split("/").length - 2] == null ? "" :
                                            secondParentFolder + "📂&nbsp;" + f.split("/")[f.split("/").length - 2] + " / ";
                                    const filePath = parentFolder + "📄&nbsp;" + getFileTitle(f);
                                    return (
                                        <option value={f} title={f} key={i}>
                                            {filePath}
                                        </option>);
                                })}
                            </select>);
                    }}
                    </UserOptionContext.Consumer>
                    <input className='newTask' type='text' placeholder='Enter your tasks here' ref={this.newTaskInput}
                        onInput={this.onQuickEntryNewTaskInput} onKeyUp={this.onQuickEntryNewTaskKeyUp}
                        onFocus={this.onQuickEntryPanelFocus} onBlur={this.onQuickEntryPanelBlur} />
                </div>
                <div className='right'>
                    <CreateNewTaskContext.Consumer>{callback => (
                        <button className='ok' ref={this.okButton} aria-label='Append new task to selected note'
                            onClick={() => {
                                const filePath = this.fileSelect.current?.value;
                                const newTask = this.newTaskInput.current?.value;
                                if (!newTask || !filePath) return;
                                if (newTask.length > 1) {
                                    callback.handleCreateNewTask(filePath, newTask);
                                } else {
                                    this.newTaskInput.current?.focus();
                                };
                            }}>
                            {Icons.buttonIcon}
                        </button>)}
                    </CreateNewTaskContext.Consumer>
                </div>
            </div>
        );
    }
}

class TodayFocus extends React.Component {
    render(): React.ReactNode {
        return (
            <TodayFocusEventHandlers.Consumer>{callback => (
                <div className='todayHeader' aria-label='Focus today' onClick={callback.handleTodayFocusClick}>
                    Today
                </div>)}
            </TodayFocusEventHandlers.Consumer>
        );
    }
}

const defaultCountersProps = {
}

type CountersProps = Readonly<typeof defaultCountersProps>;

class Counters extends React.Component<CountersProps> {
    render(): React.ReactNode {
        return (
            <UserOptionContext.Consumer>{options => (
                < div className='counters' >
                    {options.counters.map((c, i) =>
                        <CounterItem onClick={c.onClick} cnt={c.cnt} label={c.label} ariaLabel={c.ariaLabel} key={i} />
                    )}
                </div>
            )}
            </UserOptionContext.Consumer>
        );
    }
}

const defaultCounterProps = {
    onClick: () => { },
    cnt: 0,
    label: "",
    ariaLabel: ""
}

export type CounterProps = Readonly<typeof defaultCounterProps>;

class CounterItem extends React.Component<CounterProps> {
    render(): React.ReactNode {
        return (<div className='counter' id={this.props.label} aria-label={this.props.ariaLabel} onClick={this.props.onClick}>
            <div className='count'>{this.props.cnt}</div>
            <div className='label'>{this.props.label}</div>
        </div>
        );
    }
}