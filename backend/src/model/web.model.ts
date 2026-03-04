export class WebResponse<T> {
    data?: T;
    errors?: string;
    paging?: Paging;
}

export class Paging {
    size: number;
    totalPage: number;
    currentPage: number;
}
