const response = (status_code, data, message, res) => {
    res.status(status_code).json({
        payload: {
            data: data,
        },
        message: message,
    })
}

export default response;