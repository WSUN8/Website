def testFuncWorkingOne(parameterOne, parameterTwo):
    result = float(parameterOne) + float(parameterTwo)
    return result


def testFuncWorkingTwo(parameterOne, parameterTwo):
    result = float(parameterOne) + float(parameterTwo)
    return result


def testFuncWMultParam(*parameters):
    result = 0.0
    for parameter in parameters:
        result = result + float(parameter)
    return result


print(testFuncWMultParam("55", "5"))
print(testFuncWorkingOne("55", 5))
print(testFuncWorkingTwo(55, 5))
