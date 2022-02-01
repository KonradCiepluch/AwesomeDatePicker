import getDaysInMonth from "date-fns/getDaysInMonth";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const initialDragState = { days: false, months: false, years: false };

type ElementsType = "days" | "months" | "years";

class DateHandler {
  static getInitialClass(index: number, length: number, type: ElementsType) {
    let className = `calendar__${type.replace("s", " ")}`;

    if (index <= 3) className += `date__picker--next-${index}`;
    else if (index >= length - 3) className += `date__picker--prev-${length - index}`;

    return className;
  }

  static getNewOrder(index: number, length: number, type: "increase" | "decrease") {
    let changedIndex: number;

    if (type === "increase") changedIndex = index + 1 === length ? 0 : index + 1;
    else changedIndex = index - 1 < 0 ? length - 1 : index - 1;

    return changedIndex;
  }

  static getElementCenterOffset(element: HTMLElement) {
    const { top, height } = element.getBoundingClientRect();

    // container offsetTop plus half height and half of selected element height
    return top + height / 2 - 12.5;
  }

  static getValidDate(day: number, month: number, year: number, lastDay: number) {
    const validDay = day <= lastDay ? `-${day}` : "";
    const date = new Date(`${year}-${month}${validDay}`);
    return date;
  }
}

class DatePicker {
  date = new Date();
  daysContainer = document.querySelector(".calendar__days") as HTMLUListElement;
  monthsContainer = document.querySelector(".calendar__months") as HTMLUListElement;
  yearsContainer = document.querySelector(".calendar__years") as HTMLUListElement;
  monthsContainerCenterOffsetTop = DateHandler.getElementCenterOffset(this.monthsContainer);
  days: HTMLLIElement[] = [];
  months: HTMLLIElement[] = [];
  years: HTMLLIElement[] = [];
  dragState = { ...initialDragState };
  swipeStart = 0;
  isSwiping = false;

  constructor() {
    this.initPicker();
  }

  setDragState = () => {
    this.dragState = { ...initialDragState };
  };

  initPicker() {
    document.body.addEventListener("mouseup", this.setDragState);
    document.body.addEventListener("touchend", this.setDragState);
    this.initDays(this.date);
    this.initMonths();
    this.initYears();
  }

  initDays(date: Date) {
    this.daysContainer.innerHTML = ``;

    const daysInMonth = getDaysInMonth(date);

    let startingDay = date.getDate();

    const daysArray = [];

    while (startingDay <= daysInMonth && daysArray.length < daysInMonth) {
      daysArray.push(startingDay);
      startingDay++;
      if (startingDay > daysInMonth) startingDay = 1;
    }

    this.renderElements(this.daysContainer, daysArray, "days");
  }

  initMonths() {
    let monthIndex = this.date.getMonth();

    const monthsArray: string[] = [];

    while (monthIndex < months.length && monthsArray.length < months.length) {
      const month = months[monthIndex];
      monthsArray.push(month);
      monthIndex++;
      if (monthIndex === months.length) monthIndex = 0;
    }

    this.renderElements(this.monthsContainer, monthsArray, "months");
  }

  initYears() {
    const yearsArray = [];

    let startingYear = this.date.getFullYear();

    const totalYearsNumber = 2050 - 1970;

    while (startingYear <= 2050 && yearsArray.length <= totalYearsNumber) {
      yearsArray.push(startingYear);
      startingYear++;
      if (startingYear > 2050) startingYear = 1970;
    }

    this.renderElements(this.yearsContainer, yearsArray, "years");
  }

  renderElements<T>(container: HTMLUListElement, array: T[], type: ElementsType) {
    const fragment = document.createDocumentFragment();

    array.forEach((name, index, array) => {
      const element = document.createElement("li");
      element.className = DateHandler.getInitialClass(index, array.length, type);
      element.textContent = `${name}`;

      fragment.appendChild(element);
    });

    container.addEventListener("mousedown", (e) => this.handleDate(e.clientY, type));
    container.addEventListener("mousemove", (e) => this.swipeElement(e.clientY, type));
    container.addEventListener("touchstart", ({ touches }) => this.handleDate(touches[0].clientY, type));
    container.addEventListener("touchmove", ({ touches }) => this.swipeElement(touches[0].clientY, type));

    container.appendChild(fragment);
    this[type] = [...(container.children as unknown as [])];
  }

  handleDate(start: number, type: ElementsType) {
    this.swipeStart = start;
    this.dragState[type] = true;
  }

  swipeElement(position: number, type: ElementsType) {
    if (!this.dragState[type]) return;

    if (this.isSwiping) return;

    this.isSwiping = true;

    const reorderedArray: HTMLLIElement[] = [];

    const operationType = this.swipeStart > position ? "decrease" : "increase";

    this[type].forEach((element, index, array) => {
      const newIndex = DateHandler.getNewOrder(index, array.length, operationType);
      element.className = DateHandler.getInitialClass(newIndex, array.length, type);
      reorderedArray[newIndex] = element;
    });

    this[type] = reorderedArray;

    setTimeout(() => {
      this.isSwiping = false;
      this.validateDate();
    }, 100);
  }

  validateDate() {
    const { day, month, year } = this.getSelectedDate();

    const lastDay = this.getLastDay();

    const daysInMonth = getDaysInMonth(new Date(`${year}-${month}`));

    const date = DateHandler.getValidDate(day, month, year, daysInMonth);

    if (daysInMonth !== lastDay) this.initDays(date);
  }

  getSelectedDate() {
    const [dayElement, monthElement, yearElement] = [this.days, this.months, this.years].map((dateArray) => {
      return dateArray.find((element) => {
        const { top } = element.getBoundingClientRect();

        return top === this.monthsContainerCenterOffsetTop;
      });
    });

    const { textContent: day } = dayElement as HTMLLIElement;

    const { textContent: month } = monthElement as HTMLLIElement;

    const { textContent: year } = yearElement as HTMLLIElement;

    const monthIndex = months.findIndex((element) => element === month);

    return { day: Number(day), month: monthIndex + 1, year: Number(year) };
  }

  getLastDay() {
    const days = [...this.days];
    const [lastDay] = days.sort((a, b) => Number(b.textContent) - Number(a.textContent));
    return Number(lastDay.textContent);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new DatePicker();
});
